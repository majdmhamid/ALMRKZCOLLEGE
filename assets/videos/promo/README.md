# فيديوهات الدعاية — Promo videos

<div dir="rtl">

هون بتنحط فيديوهات الدعاية اللي بالمجلد المشترك:

`\\Desktop-ktffbra\חומר משותף\מכללת המרכז\פרסום\סרטונים לפרסום`

## أسهل طريقة — ٣ خطوات

١. افتح المجلد المشترك فوق، علّم كل الفيديوهات، وانسخهم (Ctrl+C).
٢. الصقهم هون، بمجلد `assets\videos\promo` (Ctrl+V).
٣. احكي لكلود: **ارفع الشغل على GitHub**.

خلص. الفيديوهات صارت بالمستودع وجاهزة للموقع الجديد.

## أو خلّي السكربت ينسخهم بدالك

من داخل مجلد المشروع، بالـ PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\import-videos.ps1
```

بينسخ كل الفيديوهات من المجلد المشترك لهون، وبيطبع حجم كل ملف،
وبيحذّرك إذا في ملف كبير كثير.

## قاعدة الحجم ⚠️

GitHub بيرفض أي ملف حجمه **100 ميغا أو أكثر**. إذا السكربت (أو كلود) قال إنه
في ملف كبير، احكي لكلود وحدة من هدول:

> صغّر الفيديو «اسم الملف» ليصير تحت 100 ميغا

> فعّل Git LFS للفيديوهات

## ملاحظة للموقع

فيديو دعاية طويل أو ثقيل ما بيتحمّل منيح من داخل الموقع. للفيديوهات الكبيرة
الأسهل إنك ترفعها على يوتيوب (Unlisted) وتحطها بالموقع كـ embed — احكي لكلود
"حط فيديو يوتيوب بالصفحة" وبيعملها.

</div>

---

## English

Drop the promo videos from the shared drive
(`\\Desktop-ktffbra\חומר משותף\מכללת המרכז\פרסום\סרטונים לפרסום`) into this
folder, then tell Claude to push to GitHub. Or let
`scripts/import-videos.ps1` copy them for you and report file sizes.

GitHub refuses single files of **100 MB or more**. For any file that big,
either re-encode it smaller or enable Git LFS (`.gitattributes` has the lines
ready to uncomment; see `assets/README.md`). Long or heavy videos are usually
better hosted on YouTube (unlisted) and embedded in the site.
