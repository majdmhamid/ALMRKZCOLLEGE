import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { normalizeIsraeliId } from "./israeli-id";

/** 32 random bytes, base64url (43 chars). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export function isWellFormedToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/** What we store in the DB for a signing token. */
export function hashToken(token: string): string {
  return sha256Hex(token);
}

function decodeKey(b64: string, name: string): Buffer {
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error(`${name} must be 32 bytes, base64-encoded`);
  return key;
}

/**
 * HMAC of the normalized 9-digit ID. Throws on malformed input — callers must
 * validate first so an invalid ID never becomes a lookup key.
 */
export function hashIdNumber(id: string, secret: string): string {
  const normalized = normalizeIsraeliId(id);
  if (!normalized) throw new Error("Malformed ID number");
  if (!secret || secret.length < 32) throw new Error("ID_HMAC_SECRET is missing or too short");
  return createHmac("sha256", secret).update(`il-id:${normalized}`).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || !/^[0-9a-f]*$/.test(a) || !/^[0-9a-f]*$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/**
 * AES-256-GCM so the admin can copy a link again later. Format:
 * v1.<iv b64url>.<ciphertext b64url>.<tag b64url>
 */
export function encryptToken(token: string, keyB64: string): string {
  const key = decodeKey(keyB64, "TOKEN_ENC_KEY");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), ct.toString("base64url"), tag.toString("base64url")].join(".");
}

export function decryptToken(payload: string, keyB64: string): string {
  const [v, ivS, ctS, tagS] = payload.split(".");
  if (v !== "v1" || !ivS || !ctS || !tagS) throw new Error("Bad encrypted token format");
  const key = decodeKey(keyB64, "TOKEN_ENC_KEY");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivS, "base64url"));
  decipher.setAuthTag(Buffer.from(tagS, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctS, "base64url")), decipher.final()]).toString("utf8");
}

/** Mints a token and everything the DB needs about it. */
export function mintToken(encKeyB64: string) {
  const token = generateToken();
  return { token, hash: hashToken(token), enc: encryptToken(token, encKeyB64) };
}
