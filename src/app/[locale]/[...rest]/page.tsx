import { notFound } from "next/navigation";

/** أي رابط غير معروف تحت /ar أو /he يعرض صفحة 404 بلغة الزائر */
export default function CatchAllPage() {
  notFound();
}
