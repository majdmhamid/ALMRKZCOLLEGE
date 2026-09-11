#!/usr/bin/env python3
"""Crawl almrkz.net and download every image and video it references.

Replaces the `wget --recursive` step in fetch-media.sh, which is not available
on Windows. Stays on the site's own host, walks the /he and /ar locales, and
pulls media out of HTML (img, source, video, srcset, inline background-image,
og:image, favicons) and out of the CSS files those pages load.

Usage:
    python scripts/fetch-website-media.py [--max-pages N]
"""

import argparse
import json
import os
import re
import sys
import time
from collections import deque
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, unquote, quote
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

START_URLS = ["https://almrkz.net/he", "https://almrkz.net/ar"]
HOST = "almrkz.net"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(REPO_ROOT, "assets", "images", "website")
VID_DIR = os.path.join(REPO_ROOT, "assets", "videos", "website")
MANIFEST = os.path.join(REPO_ROOT, "assets", "website-media.json")

IMG_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".ico", ".bmp"}
VID_EXT = {".mp4", ".webm", ".mov", ".m4v", ".ogv"}

# Vendor libraries (bootstrap, swiper, ...) ship their own icons; they are not
# the college's media and only add noise to the asset tree.
SKIP_PATH = re.compile(r"/assets/vendor/", re.I)


def encode(url):
    """Percent-encode the path/query. The site has hrefs holding raw Arabic and
    Hebrew text, which urllib rejects outright as control characters."""
    p = urlparse(url)
    return p._replace(path=quote(p.path, safe="/%:@!$&'()*+,;=~"),
                      query=quote(p.query, safe="/%:@!$&'()*+,;=~?&")).geturl()


def get(url, timeout=30):
    req = Request(encode(url),
                  headers={"User-Agent": UA, "Accept-Language": "ar,he,en"})
    with urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")


class Extractor(HTMLParser):
    """Collects page links, media URLs and stylesheet URLs from one page."""

    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.links, self.media, self.css = set(), set(), set()

    def _add_media(self, value):
        if value and not value.startswith("data:"):
            self.media.add(urljoin(self.base, value.strip()))

    def _add_srcset(self, value):
        for part in value.split(","):
            url = part.strip().split(" ")[0]
            self._add_media(url)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)

        if tag == "a" and a.get("href"):
            self.links.add(urljoin(self.base, a["href"]))
        elif tag in ("img", "video", "source", "embed"):
            for key in ("src", "data-src", "data-original", "poster"):
                self._add_media(a.get(key))
            if a.get("srcset"):
                self._add_srcset(a["srcset"])
        elif tag == "link":
            rel = (a.get("rel") or "").lower()
            if "stylesheet" in rel and a.get("href"):
                self.css.add(urljoin(self.base, a["href"]))
            elif "icon" in rel:
                self._add_media(a.get("href"))
        elif tag == "meta":
            prop = (a.get("property") or a.get("name") or "").lower()
            if prop in ("og:image", "twitter:image"):
                self._add_media(a.get("content"))

        # Inline background-image on any element.
        if a.get("style"):
            for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)", a["style"]):
                self._add_media(m.group(1))


def classify(url):
    ext = os.path.splitext(urlparse(url).path)[1].lower()
    if ext in IMG_EXT:
        return "image"
    if ext in VID_EXT:
        return "video"
    return None


def local_name(url):
    """Flatten the URL path into a filename that keeps its origin readable."""
    path = unquote(urlparse(url).path).lstrip("/")
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", path.replace("/", "__"))
    return name[-150:] if len(name) > 150 else name


def download(url, dest_dir):
    os.makedirs(dest_dir, exist_ok=True)
    path = os.path.join(dest_dir, local_name(url))
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path, os.path.getsize(path), "cached"
    data, _ = get(url, timeout=60)
    with open(path, "wb") as f:
        f.write(data)
    return path, len(data), "downloaded"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-pages", type=int, default=200)
    args = ap.parse_args()

    queue = deque(START_URLS)
    seen_pages, media, css_files = set(), set(), set()

    while queue and len(seen_pages) < args.max_pages:
        url = queue.popleft()
        clean = url.split("#")[0].rstrip("/")
        if clean in seen_pages or urlparse(url).netloc.replace("www.", "") != HOST:
            continue
        seen_pages.add(clean)

        try:
            body, ctype = get(url)
        except Exception as e:
            print(f"  ! {url}: {e}", file=sys.stderr)
            continue
        if "html" not in ctype:
            continue

        parser = Extractor(url)
        parser.feed(body.decode("utf-8", "replace"))
        media |= parser.media
        css_files |= parser.css
        for link in parser.links:
            if urlparse(link).netloc.replace("www.", "") == HOST:
                queue.append(link)
        print(f"  page {len(seen_pages):3d}  {url}")
        time.sleep(0.3)

    # Media referenced only from stylesheets (hero backgrounds, icons).
    for css in css_files:
        if SKIP_PATH.search(css):
            continue
        try:
            body, _ = get(css)
        except Exception:
            continue
        for m in re.finditer(r"url\(\s*['\"]?([^'\")]+)", body.decode("utf-8", "replace")):
            ref = m.group(1).strip()
            if not ref.startswith("data:"):
                media.add(urljoin(css, ref))

    records, failed = [], []
    for url in sorted(media):
        kind = classify(url)
        if not kind or SKIP_PATH.search(url):
            continue
        if urlparse(url).netloc.replace("www.", "") != HOST:
            continue
        dest = IMG_DIR if kind == "image" else VID_DIR
        try:
            path, size, how = download(url, dest)
        except Exception as e:
            print(f"  ! {url}: {e}", file=sys.stderr)
            failed.append({"url": url, "error": str(e)})
            continue
        records.append({
            "url": url,
            "kind": kind,
            "file": os.path.relpath(path, REPO_ROOT).replace("\\", "/"),
            "bytes": size,
        })
        print(f"  {how:10s} {size:>9,d}  {os.path.basename(path)}")

    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump({
            "source": "https://almrkz.net",
            "pages_crawled": sorted(seen_pages),
            "assets": records,
            "failed": failed,
        }, f, ensure_ascii=False, indent=2)

    images = sum(1 for r in records if r["kind"] == "image")
    videos = sum(1 for r in records if r["kind"] == "video")
    total = sum(r["bytes"] for r in records)
    print(f"\n{len(seen_pages)} pages | {images} images | {videos} videos "
          f"| {total/1e6:.1f} MB | {len(failed)} failed")


if __name__ == "__main__":
    main()
