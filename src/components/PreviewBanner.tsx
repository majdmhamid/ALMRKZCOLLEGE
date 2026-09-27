import { draftMode } from "next/headers";
import Link from "next/link";

/**
 * شريط يظهر فقط للمدير وهو بيعاين المسودة (قبل النشر) — الزوار ما بشوفوه أبداً.
 */
export default async function PreviewBanner({ path }: { path: string }) {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  return (
    <div className="sticky top-0 z-[70] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-400 px-4 py-2 text-center text-sm font-bold text-amber-950" lang="ar" dir="rtl">
      <span>👁 أنت بتشوف المسودة — هيك رح يصير الموقع بعد «نشر». الزوار لسا بشوفوا النسخة القديمة.</span>
      <Link href="/admin" className="rounded-lg bg-amber-950 px-3 py-1 text-white hover:bg-black">
        رجوع للوحة التحكم
      </Link>
      <a href={`/admin/preview?exit=1&path=${encodeURIComponent(path)}`} className="underline">
        خروج من المعاينة
      </a>
    </div>
  );
}
