# סרטוני פרסום / فيديوهات الدعاية — Promo videos

<div dir="rtl">

## من وين بتيجي

الفيديوهات موجودة على الشبكة الداخلية للكلية، بهالمسار:

`\\Desktop-ktffbra\חומר משותף\מכללת המרכז\פרסום\סרטונים לפרסום`

Claude Code على الويب **ما بيشوف هالمسار** (بيشتغل على سيرفر بعيد، مش على
جهازك)، فالاستيراد لازم يصير من كمبيوتر موصول على شبكة الكلية.

## كيف تستوردها

١. على الكمبيوتر اللي بيشوف الـ share، افتح PowerShell بمجلد المشروع وشغّل:

```powershell
.\scripts\import-promo-videos.ps1
```

   بينسخ كل الفيديوهات لـ `assets/videos/promo/_inbox/` (هالمجلد **ما بينرفع**
   على GitHub، هو بس محطة مؤقتة). إذا الـ share فيه مجلدات فرعية بيحافظ عليها —
   غالباً أسماءها هي أصلاً "النوع".

٢. احكي لكلود على نفس الكمبيوتر:

> رتّب الفيديوهات اللي بالـ inbox حسب النوع

   بيحرّكها للمجلدات اللي تحت وبيعبّي `manifest.json` (اسم، نوع، وصف، مدة، حجم).

٣. الفيديوهات فوق ~10MB لازم Git LFS قبل الرفع — الأوامر جاهزة في `assets/README.md`.

٤. بعدين: "ارفع الشغل على GitHub".

## التصنيف

| المجلد | شو فيه |
|---|---|
| `courses/` | فيديو لكل دورة أو مسار (كهرباء، ميكانيكا، طبخ...) |
| `testimonials/` | طلاب وخريجين بيحكوا عن تجربتهم |
| `campus/` | جولة بالكلية، الورشات، المختبرات، المعدات |
| `events/` | حفلات تخريج، يوم مفتوح، فعاليات |
| `general/` | فيديو تعريفي عام عن الكلية، إعلانات تسجيل |

هالتقسيم **اقتراح** مبني على اللي عادةً بيكون بموقع كلية مهنية — غيّره أو زيد
عليه حسب اللي فعلاً موجود بالفيديوهات. المهم إنو كل فيديو يكون بمكان واحد
واضح، ويكون مسجّل بـ `manifest.json` عشان الموقع يعرف وين يعرضه.

</div>

## English

The college's marketing videos live on an internal Windows share
(`\\Desktop-ktffbra\חומר משותף\מכללת המרכז\פרסום\סרטונים לפרסום`). Claude Code
web sessions run on a remote server and cannot reach it, so the import has to
start from a machine on the college network:

1. From the repo root, in PowerShell: `.\scripts\import-promo-videos.ps1`.
   It copies every video into `assets/videos/promo/_inbox/` (gitignored staging
   area, subfolders preserved). From Git Bash the share is reachable as
   `//Desktop-ktffbra/חומר משותף/...`.
2. Sort the inbox into the type folders below and record each video in
   `manifest.json`.
3. Videos over ~10 MB go through Git LFS first (see `assets/README.md`).
4. Commit and push.

| Folder | Contents |
|---|---|
| `courses/` | One promo per course / track |
| `testimonials/` | Students and graduates talking about their experience |
| `campus/` | Tours of the college, workshops, labs, equipment |
| `events/` | Graduations, open days, other events |
| `general/` | General brand / enrolment videos |

The split is a proposal; adjust it to what the videos actually are. What
matters is that each video has exactly one home and one `manifest.json` entry
so the website knows where to show it.

### `manifest.json` fields

| Field | Meaning |
|---|---|
| `file` | Path relative to this folder, e.g. `courses/electricity-2025.mp4` |
| `category` | One of the folder names above |
| `title_ar` / `title_he` | Display titles for the site |
| `description` | One or two sentences, any language |
| `course` | Course/track name when `category` is `courses`, otherwise `null` |
| `duration_seconds`, `resolution`, `size_mb` | From the file (ffprobe or file properties) |
| `use_on_site` | Where it should appear: `home`, `course-page`, `about`, `gallery`... |
| `consent_checked` | `true` once someone confirmed the people shown agreed to publication |
| `original_name` | The filename as it was on the share, for tracing back |
