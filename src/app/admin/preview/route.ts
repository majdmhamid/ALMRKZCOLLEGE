import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/cms/auth";

/**
 * «معاينة الموقع»: يفتح صفحة من الموقع بالمسودة (قبل النشر). للمدير فقط.
 * /admin/preview?path=/ar/graduates      → تشغيل المعاينة
 * /admin/preview?exit=1&path=/ar         → إيقافها
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("path") || "/ar";
  // فقط مسارات داخلية من الموقع نفسه
  const safe = /^\/(ar|he)(\/[a-z0-9\-/]*)?$/i.test(target) ? target : "/ar";
  const dm = await draftMode();
  if (url.searchParams.get("exit")) {
    dm.disable();
    redirect(safe);
  }
  if (!(await isAdmin())) redirect("/admin/login");
  dm.enable();
  redirect(safe);
}
