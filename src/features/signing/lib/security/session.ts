import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Tiny signed, expiring payloads (HMAC-SHA256) — used for the signer's
 * "ID verified" cookie so the next requests don't need the ID again.
 * Format: <payload b64url>.<sig b64url>
 */
export function signPayload<T extends object>(data: T, secret: string, ttlSeconds: number, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Math.floor(now / 1000) + ttlSeconds })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyPayload<T extends object>(value: string | undefined, secret: string, now = Date.now()): T | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T & { exp: number };
    if (typeof parsed.exp !== "number" || parsed.exp * 1000 < now) return null;
    return parsed;
  } catch {
    return null;
  }
}
