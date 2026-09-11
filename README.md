# ALMRKZCOLLEGE

Asset repository for **كلية المركز / מכללת המרכז להכשרה מקצועית**
(Al-Merkaz College for Professional Training, Umm el-Fahm) — collecting images
and video from the college's existing web presence for use in the new website.

## Contents

| Path | What it is |
|---|---|
| `assets/sources.json` | Every known public page of the college, and where its media should land |
| `assets/` | Image and video assets, grouped by source — **currently empty**, see below |
| `scripts/fetch-media.sh` | Downloads the media described in `sources.json` |

## Status

The assets folders are empty. The media could not be downloaded from the Claude
Code web session: its egress proxy permits only package registries and GitHub,
so every social platform and the college's own site returned `403`.

To populate them, run this on a machine with normal internet access:

```bash
pip install -U yt-dlp gallery-dl
./scripts/fetch-media.sh
```

Read `assets/README.md` first — `sources.json` holds unverified URLs that should
be checked before the first run, and Instagram/Facebook need browser cookies to
return more than a few posts.
