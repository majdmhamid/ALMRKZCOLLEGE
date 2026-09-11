# ملفات الوسائط — Media assets

<div dir="rtl">

## الوضع الحالي ⚠️

المجلدات هنا **فاضية**. ما قدرت أنزّل الصور والفيديوهات من صفحات الكلية،
لأن جلسة Claude Code على الويب بتشتغل خلف بروكسي بيمنع الإنترنت كله
ما عدا مستودعات الحزم و GitHub. فيسبوك وإنستغرام وتيك توك وموقع
`almrkz.net` كلهم رجّعوا `403` من البروكسي.

اللي جاهز هون هو **الهيكل + سكربت التنزيل**. لما تشغّل السكربت من جهازك
(أو من أي مكان الإنترنت فيه مفتوح) رح يعبّي المجلدات لحاله.

```bash
pip install -U yt-dlp gallery-dl      # مرة وحدة
./scripts/fetch-media.sh              # كل المصادر
./scripts/fetch-media.sh instagram    # مصدر واحد بس
```

</div>

## Why these folders are empty

The media could not be downloaded from this environment. The Claude Code web
session runs behind an egress proxy that allows only package registries and
GitHub; `facebook.com`, `instagram.com`, `tiktok.com` and `almrkz.net` were all
refused with `403` at the proxy. What is committed here is the **structure plus
a fetch script** — run it anywhere with open network access and it fills these
folders in.

## Layout

```
assets/
├── sources.json          # where each asset comes from - edit this first
├── brand/                # logo, wordmark, colors (add by hand)
├── images/
│   ├── facebook/         # ← scripts/fetch-media.sh
│   ├── instagram/        # ← scripts/fetch-media.sh
│   └── website/          # ← scripts/fetch-media.sh (almrkz.net)
└── videos/
    ├── facebook/
    ├── instagram/
    └── tiktok/
```

## Before you run the script

Open `assets/sources.json` and check every entry. The URLs in it came from
**search-result summaries only** — I could not open the pages to confirm them,
so each is marked `"verified": false`. Two things in particular to check:

- The Facebook handle is `almerkaz.collega` but the Instagram handle is
  `almerkaz.college`. That inconsistency is what search returned; confirm both.
- **No TikTok account was found.** Its entry has `"url": null`. If the college
  has one, paste the URL in and rerun.

Flip `"verified"` to `true` as you confirm each one.

## Getting more than a handful of posts

Instagram and Facebook heavily limit anonymous downloads. To pull a full page:

1. Log into the account in your browser.
2. Export cookies with a "Get cookies.txt" browser extension.
3. Save as `cookies.txt` in the repo root — it is gitignored, so it will not be
   committed. **Do not commit it**; it grants access to the account.
4. Rerun `./scripts/fetch-media.sh`.

Use an account that actually administers the college pages. Downloading the
college's own material for the college's own new site is fine; pulling other
people's media from those pages is not, so review what lands before committing.

## Large video files

Git handles big binaries badly. Before committing any video over ~10 MB:

```bash
git lfs install
git lfs track "*.mp4" "*.webm" "*.mov"
git add .gitattributes
```

`.gitattributes` already has these lines ready — just uncomment them.

## Before using anything on the new site

Downloaded media is raw source material, not web-ready. Expect to:

- re-encode and resize (a 4 MB Facebook JPEG has no business on a landing page),
- generate `webp`/`avif` alongside originals,
- keep originals in `assets/` and commit optimized output to the site's own
  build pipeline,
- check faces — student photos may need consent before republishing.
