# ملفات الوسائط — Media assets

<div dir="rtl">

## الوضع الحالي ✅

الوسائط **نزّلناها فعلاً** بتاريخ 2026-09-11 من جهاز محلي (الإنترنت مفتوح،
مش زي جلسة الويب اللي كانت محجوبة ببروكسي).

| المصدر | إيش نزل | وين |
|---|---|---|
| `almrkz.net` | **113 صورة** من 72 صفحة (עברית + العربية)، 30 ميغا | `images/website/` |
| يوتيوب الكلية | **فيديوهان** (2021)، 72 ميغا — مكتبة الفيديو بالموقع أصلاً روابط يوتيوب | `videos/website/` |
| فيسبوك | **525 صورة**، 77 ميغا | `images/facebook/` |
| فيسبوك — فيديو | ❌ محجوب بدون تسجيل دخول | `videos/facebook/` |
| كمبيوتر الكلية (مجلد مشترك) | **6 فيديوهات إعلانية**، 513 ميغا — عبر Git LFS | `videos/promo/` |
| إنستغرام | ❌ ما لقينا حساب للكلية | `images/instagram/` |

`website-media.json` فيه سجل كامل: كل ملف، من أي رابط إجا، وقدّيش حجمه.

## اللي ناقص وليش

**فيديوهات فيسبوك** — فيسبوك بيرجّع `HTTP 400` على تبويب الفيديوهات لأي زائر
مش مسجّل دخول، و`yt-dlp` و`gallery-dl` الاثنين ما بيقدروا يعدّوا التبويب.
الصور نزلت عادي لأنها مكشوفة للعامة. لتنزيل الفيديوهات لازم كوكيز متصفّح
(اشرح تحت).

**إنستغرام** — الحساب اللي كان مكتوب بالملف (`almerkaz.college`) **مش موجود**،
إنستغرام بيرجّع `NotFoundError`. دوّرنا وما لقينا حساب للكلية: موقع الكلية
بيربط فيسبوك ويوتيوب بس، وصفحة الفيسبوك ما بتعرض رابط إنستغرام للعامة.
إذا بتعرف الحساب، حطّه بـ `sources.json` وشغّل السكربت.

> ⚠️ انتبه: `instagram.com` بيرجّع `200` لأي اسم حساب (جدار تسجيل دخول)،
> فـ `200` **مش دليل** إنّ الحساب موجود.

</div>

## Layout

```
assets/
├── sources.json          # every source, with what was actually verified
├── website-media.json    # per-file record of the almrkz.net crawl
├── brand/                # logo, wordmark, colors (add by hand)
├── images/
│   ├── facebook/         # ← gallery-dl
│   ├── instagram/        # empty - no account found
│   └── website/          # ← scripts/fetch-website-media.py
└── videos/
    ├── facebook/         # empty - needs cookies
    ├── instagram/        # empty - no account found
    ├── promo/            # ← 6 promo videos from the college PC, stored in Git LFS
    ├── tiktok/           # empty - no account found
    └── website/          # ← yt-dlp, from the college YouTube channel
```

## Re-running the downloads

```bash
pip install -U yt-dlp gallery-dl imageio-ffmpeg

python scripts/fetch-website-media.py          # almrkz.net images
./scripts/fetch-media.sh facebook              # Facebook photos
```

`fetch-website-media.py` replaces the `wget --recursive` step for the website:
wget is not present on Windows, and the site has hrefs containing raw Arabic and
Hebrew text that need percent-encoding before a fetch will even be attempted.

Both downloaders keep a `.download-archive`, so a rerun only fetches what is new.

## Getting the Facebook videos (and Instagram, if an account turns up)

1. Log into an account that administers the college page.
2. Export cookies with a "Get cookies.txt" browser extension.
3. Save as `cookies.txt` in the repo root — gitignored, **do not commit it**;
   it grants access to the account.
4. Rerun `./scripts/fetch-media.sh`.

Downloading the college's own material for the college's own new site is fine;
pulling other people's media off those pages is not, so review what lands before
committing.

## Large video files

`assets/videos/promo/` (six promo videos, 42-186 MB each, 513 MB total) is
stored in **Git LFS** - two of the files are over GitHub's 100 MB hard limit.
The rule lives at the bottom of `.gitattributes`; the folder is also
re-included in `.gitignore`, which otherwise ignores every video under
`assets/videos/`.

On a fresh clone the videos arrive as tiny pointer files until LFS is set up:

```bash
git lfs install
git lfs pull
```

The YouTube downloads in `videos/website/` stay gitignored - they can be
re-fetched with `yt-dlp` at any time.

## Before using anything on the new site

Downloaded media is raw source material, not web-ready. Expect to:

- re-encode and resize (a 3.4 MB slideshow PNG has no business on a landing page),
- generate `webp`/`avif` alongside originals,
- keep originals in `assets/` and commit optimized output to the site's own
  build pipeline,
- check faces — student photos may need consent before republishing.
