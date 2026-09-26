import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { isMockBackend } from "@/lib/env";
import { mockFilePath, verifyMockSignature } from "@/server/storage";

/** Mock-mode stand-in for Supabase Storage signed URLs. 404s unless MOCK_BACKEND=1. */

const MAX_BYTES = 50 * 1024 * 1024;
const TYPES: Record<string, string> = { ".pdf": "application/pdf", ".png": "image/png" };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (!isMockBackend || params.get("op") !== "read" || !verifyMockSignature(params)) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const file = mockFilePath(params.get("b")!, params.get("p")!);
    const body = await readFile(file);
    const name = params.get("d");
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
        "cache-control": "private, no-store",
        ...(name ? { "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}` } : {}),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

export async function PUT(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (!isMockBackend || params.get("op") !== "upload" || !verifyMockSignature(params)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_BYTES) return new NextResponse("Too large", { status: 413 });
  const file = mockFilePath(params.get("b")!, params.get("p")!);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return NextResponse.json({ Key: `${params.get("b")}/${params.get("p")}` });
}
