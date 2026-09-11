#!/usr/bin/env bash
#
# Downloads the college's public images and videos from the sources listed in
# assets/sources.json into the assets/ tree.
#
# This CANNOT run inside a Claude Code web session: that environment's egress
# policy allows only package registries and GitHub, so facebook.com,
# instagram.com, tiktok.com and almrkz.net are all refused at the proxy.
# Run it on a normal machine with open internet access.
#
# Requirements:
#   yt-dlp      - videos (TikTok, Facebook, Instagram)   pip install -U yt-dlp
#   gallery-dl  - images (Instagram, Facebook)           pip install -U gallery-dl
#   wget        - website assets
#   jq          - reads assets/sources.json
#
# Usage:
#   scripts/fetch-media.sh              # all sources
#   scripts/fetch-media.sh instagram    # one source id from sources.json
#
# Instagram and Facebook throttle or block anonymous downloads. To pull more
# than the first few public posts, log in via a browser and export cookies to
# cookies.txt in the repo root (it is gitignored), then rerun.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$REPO_ROOT/assets/sources.json"
COOKIES="$REPO_ROOT/cookies.txt"
ONLY="${1:-}"

cd "$REPO_ROOT"

for tool in jq; do
  command -v "$tool" >/dev/null || { echo "error: '$tool' is required but not installed" >&2; exit 1; }
done

cookie_args_ytdlp=()
cookie_args_gdl=()
if [[ -f "$COOKIES" ]]; then
  echo "==> using cookies from $COOKIES"
  cookie_args_ytdlp=(--cookies "$COOKIES")
  cookie_args_gdl=(--cookies "$COOKIES")
else
  echo "==> no cookies.txt found; anonymous download (expect limited results on Instagram/Facebook)"
fi

have() { command -v "$1" >/dev/null; }

# skip returns 0 when this source id should not be processed
skip() { [[ -n "$ONLY" && "$ONLY" != "$1" ]]; }

fetch_images() {  # url, dest
  local url="$1" dest="$2"
  have gallery-dl || { echo "  ! gallery-dl not installed, skipping images"; return; }
  mkdir -p "$dest"
  gallery-dl "${cookie_args_gdl[@]}" --dest "$dest" --write-metadata "$url" \
    || echo "  ! gallery-dl failed for $url (login required, rate limit, or unsupported)"
}

fetch_videos() {  # url, dest
  local url="$1" dest="$2"
  have yt-dlp || { echo "  ! yt-dlp not installed, skipping videos"; return; }
  mkdir -p "$dest"
  yt-dlp "${cookie_args_ytdlp[@]}" \
    --paths "$dest" \
    --output '%(upload_date>%Y-%m-%d|unknown)s_%(id)s.%(ext)s' \
    --write-info-json --write-thumbnail \
    --download-archive "$dest/.download-archive" \
    --ignore-errors --no-warnings \
    "$url" \
    || echo "  ! yt-dlp finished with errors for $url"
}

fetch_website() {  # url, dest
  local url="$1" dest="$2"
  have wget || { echo "  ! wget not installed, skipping website"; return; }
  mkdir -p "$dest"
  # Mirror only media files, two levels deep, staying on the same host.
  wget --recursive --level=2 --no-parent --no-directories \
       --accept 'jpg,jpeg,png,gif,webp,svg,avif,mp4,webm' \
       --directory-prefix="$dest" \
       --timeout=20 --tries=3 --wait=1 --random-wait \
       --user-agent='Mozilla/5.0 (compatible; almrkz-asset-fetch/1.0)' \
       "$url" \
    || echo "  ! wget finished with errors for $url (a 404/robots block is normal)"
}

count=0
while IFS=$'\t' read -r id platform url target_dir video_dir status; do
  skip "$id" && continue
  count=$((count + 1))
  [[ "$url" == "null" || -z "$url" ]] && { echo "==> $id: no URL in manifest (status: $status), skipping"; continue; }

  echo
  echo "==> $id ($platform)"
  echo "    $url"

  case "$platform" in
    website)
      fetch_website "$url" "$target_dir"
      ;;
    instagram|facebook)
      fetch_images "$url" "$target_dir"
      [[ "$video_dir" != "null" ]] && fetch_videos "$url" "$video_dir"
      ;;
    tiktok)
      fetch_videos "$url" "$target_dir"
      ;;
    *)
      echo "  ! unknown platform '$platform', skipping"
      ;;
  esac
done < <(jq -r '.sources[] | [.id, .platform, (.url // "null"), .target_dir, (.video_dir // "null"), .status] | @tsv' "$MANIFEST")

if [[ -n "$ONLY" && "$count" -eq 0 ]]; then
  echo "error: no source with id '$ONLY' in $MANIFEST" >&2
  exit 1
fi

echo
echo "==> done. Review what landed under assets/ before committing:"
echo "    du -sh assets/*/*  &&  git status --short assets/"
echo "    Large videos should go to Git LFS - see assets/README.md"
