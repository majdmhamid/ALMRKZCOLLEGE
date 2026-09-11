# ملفات الوسائط — Media assets

<div dir="rtl">

## الوضع الحالي ✅

الوسائط **نزّلناها فعلاً** بتاريخ 2026-09-11 من جهاز محلي (الإنترنت مفتوح،
مش زي جلسة الويب اللي كانت محجوبة ببروكسي).

| المصدر | إيش نزل | وين |
|---|---|---|
| `almrkz.net` | صور الموقع كلها (اللغتين עברית + العربية) | `images/website/` |
| يوتيوب الكلية | فيديوهات الكلية (المكتبة على الموقع أصلاً روابط يوتيوب) | `videos/website/` |
| فيسبوك | صور الصفحة | `images/facebook/` |
| فيسبوك — فيديو | ❌ محجوب بدون تسجيل دخول | `videos/facebook/` |
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

The YouTube videos are ~37 MB each. Before committing video:

```bash
git lfs install
git lfs track "*.mp4" "*.webm" "*.mov"
git add .gitattributes
```

`.gitattributes` already has these lines ready — just uncomment them.

## Before using anything on the new site

Downloaded media is raw source material, not web-ready. Expect to:

- re-encode and resize (a 3.4 MB slideshow PNG has no business on a landing page),
- generate `webp`/`avif` alongside originals,
- keep originals in `assets/` and commit optimized output to the site's own
  build pipeline,
- check faces — student photos may need consent before republishing.
