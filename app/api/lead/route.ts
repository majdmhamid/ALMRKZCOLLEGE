import { NextResponse } from "next/server";

/**
 * "Leave your details" form endpoint.
 * For now it validates and logs the lead. Delivery (email to the office + a saved list)
 * is wired here once the college picks a mailbox/provider — see README.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const lead = { name: str(body.name, 120), phone: str(body.phone, 40), course: str(body.course, 200), lang: str(body.lang, 4), at: new Date().toISOString() };

  if (!lead.name || !/^[+\d][\d\s-]{6,}$/.test(lead.phone)) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }

  console.log("[lead]", JSON.stringify(lead));
  return NextResponse.json({ ok: true });
}
