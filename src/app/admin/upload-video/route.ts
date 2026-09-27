import { isAdmin } from "@/lib/cms/auth";
import { cmsStore } from "@/lib/cms/store";

/** رفع فيديو بوضع التجربة المحلية (على الموقع الحقيقي الرفع مباشرة لـ Supabase) */
const MAX = 80 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ ok: false }, { status: 401 });
  const store = await cmsStore();
  if (store.kind !== "file") return Response.json({ ok: false }, { status: 400 });
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("video/mp4")) return Response.json({ ok: false, message: "type" }, { status: 415 });
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length > MAX) return Response.json({ ok: false, message: "too-big" }, { status: 413 });
  const url = await store.uploadMedia(bytes, "videos", "mp4", "video/mp4");
  return Response.json({ ok: true, url });
}
