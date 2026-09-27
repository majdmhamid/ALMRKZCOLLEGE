import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP and user agent (Vercel sets x-forwarded-for / x-real-ip). */
export async function requestInfo(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || null;
  return {
    ip: ip && isIp(ip) ? ip : null,
    userAgent: h.get("user-agent")?.slice(0, 500) ?? null,
  };
}

function isIp(value: string): boolean {
  return /^[0-9.]+$/.test(value) || /^[0-9a-f:]+$/i.test(value);
}
