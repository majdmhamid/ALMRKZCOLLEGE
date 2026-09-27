import { readFile } from "node:fs/promises";
import path from "node:path";
import { cmsDataDir } from "@/lib/cms/store";

/**
 * الصور المرفوعة من لوحة التحكم في وضع التجربة المحلية (بدون Supabase).
 * على الموقع الحقيقي الصور تُخدم مباشرة من Supabase Storage ولا يمرّ أحد من هنا.
 */
const TYPES: Record<string, string> = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", mp4: "video/mp4" };

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (!parts.every((p) => /^[a-z0-9._-]+$/i.test(p) && p !== ".." && p !== ".")) return new Response("Not found", { status: 404 });
  const root = path.join(cmsDataDir(), "media");
  const file = path.join(root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(file);
    const ext = file.split(".").pop()!.toLowerCase();
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
