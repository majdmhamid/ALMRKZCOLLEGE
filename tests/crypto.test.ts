import { describe, expect, it } from "vitest";
import {
  decryptToken,
  encryptToken,
  generateToken,
  hashToken,
  isWellFormedToken,
  mintToken,
} from "@/features/signing/lib/security/crypto";
import { signPayload, verifyPayload } from "@/features/signing/lib/security/session";

const KEY = Buffer.alloc(32, 1).toString("base64");
const SECRET = "x".repeat(40);

describe("tokens", () => {
  it("are 32 random bytes in base64url", () => {
    const t = generateToken();
    expect(t).toHaveLength(43);
    expect(Buffer.from(t, "base64url")).toHaveLength(32);
    expect(isWellFormedToken(t)).toBe(true);
    expect(generateToken()).not.toBe(t);
  });

  it("hash is SHA-256 hex and deterministic", () => {
    const t = generateToken();
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).toBe(hashToken(t));
    // Known vector: sha256("abc")
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("rejects malformed tokens", () => {
    expect(isWellFormedToken("short")).toBe(false);
    expect(isWellFormedToken("a".repeat(42) + "=")).toBe(false);
    expect(isWellFormedToken("../../etc/passwd".padEnd(43, "a"))).toBe(false);
  });

  it("encrypts and decrypts, and tampering fails", () => {
    const { token, hash, enc } = mintToken(KEY);
    expect(hash).toBe(hashToken(token));
    expect(enc).not.toContain(token);
    expect(decryptToken(enc, KEY)).toBe(token);

    const parts = enc.split(".");
    const ct = Buffer.from(parts[2], "base64url");
    ct[0] ^= 1;
    parts[2] = ct.toString("base64url");
    expect(() => decryptToken(parts.join("."), KEY)).toThrow();
    expect(() => decryptToken(enc, Buffer.alloc(32, 2).toString("base64"))).toThrow();
  });

  it("refuses a key that is not 32 bytes", () => {
    expect(() => encryptToken("t", Buffer.alloc(16).toString("base64"))).toThrow(/32 bytes/);
  });
});

describe("signed session payloads", () => {
  it("round-trips and expires", () => {
    const now = Date.now();
    const v = signPayload({ signerId: "s1" }, SECRET, 60, now);
    expect(verifyPayload<{ signerId: string }>(v, SECRET, now)?.signerId).toBe("s1");
    expect(verifyPayload(v, SECRET, now + 61_000)).toBeNull();
    expect(verifyPayload(v, "z".repeat(40), now)).toBeNull();
  });

  it("rejects a forged body", () => {
    const v = signPayload({ signerId: "s1" }, SECRET, 60);
    const [, sig] = v.split(".");
    const forged = Buffer.from(JSON.stringify({ signerId: "s2", exp: 9e9 })).toString("base64url");
    expect(verifyPayload(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(verifyPayload("garbage", SECRET)).toBeNull();
    expect(verifyPayload(undefined, SECRET)).toBeNull();
  });
});
