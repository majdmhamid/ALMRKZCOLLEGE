"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import type { SignatureMethod } from "@/lib/domain";
import { getDb } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { requestInfo } from "@/server/request-info";
import {
  cookieNames,
  DEVICE_COOKIE,
  MAX_SIGNATURE_BYTES,
  newDeviceId,
  openSession,
  resolveToken,
  sealDone,
  sealSession,
  SESSION_TTL_SECONDS,
  submitSignature,
  verifyId,
  type SubmitError,
  type VerifyError,
} from "@/server/services/signing";

const secure = process.env.NODE_ENV === "production";

export type VerifyState = { ok?: boolean; error?: VerifyError | "rate_limited"; attemptsLeft?: number };

export async function verifyIdAction(token: string, input: { idNumber: string; name?: string }): Promise<VerifyState> {
  const { ip, userAgent } = await requestInfo();
  const who = ip ?? "unknown";
  // Generous per IP: a whole class may sign over the college Wi-Fi. The 5-attempt
  // lockout per link/device is what actually stops guessing.
  if (!(await rateLimit(`id:ip:${who}`, 10 * 60, 150)) || !(await rateLimit(`id:tok:${token.slice(0, 16)}`, 10 * 60, 300))) {
    return { error: "rate_limited" };
  }

  const jar = await cookies();
  let deviceId = jar.get(DEVICE_COOKIE)?.value;
  if (!deviceId || !/^[A-Za-z0-9_-]{22}$/.test(deviceId)) {
    deviceId = newDeviceId();
    jar.set(DEVICE_COOKIE, deviceId, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 365 * 24 * 60 * 60 });
  }

  const db = await getDb();
  const resolved = await resolveToken(db, token);
  const result = await verifyId(db, resolved, input, { ip, userAgent, deviceId });
  if (!result.ok) return { error: result.error, attemptsLeft: result.attemptsLeft };

  jar.set(cookieNames(resolved!.tokenHash).session, sealSession(result.session), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return { ok: true };
}

const submitSchema = z.object({
  method: z.enum(["draw", "typed", "checkbox"]),
  // data:image/png;base64,...
  dataUrl: z
    .string()
    .max(Math.ceil((MAX_SIGNATURE_BYTES * 4) / 3) + 64)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/),
  readConfirmed: z.literal(true),
});

export type SubmitState = { ok?: boolean; error?: SubmitError | "rate_limited" };

export async function submitSignatureAction(
  token: string,
  input: { method: SignatureMethod; dataUrl: string; readConfirmed: boolean },
): Promise<SubmitState> {
  const { ip, userAgent } = await requestInfo();
  if (!(await rateLimit(`submit:ip:${ip ?? "unknown"}`, 10 * 60, 100))) return { error: "rate_limited" };

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues.some((i) => i.path[0] === "dataUrl") ? "image" : "invalid" };

  const db = await getDb();
  const resolved = await resolveToken(db, token);
  if (!resolved) return { error: "invalid_link" };
  const jar = await cookies();
  const names = cookieNames(resolved.tokenHash);
  const session = openSession(jar.get(names.session)?.value, resolved.tokenHash);

  const png = Buffer.from(parsed.data.dataUrl.split(",")[1], "base64");
  const result = await submitSignature(
    db,
    resolved,
    session,
    { method: parsed.data.method, png, readConfirmed: parsed.data.readConfirmed },
    { ip, userAgent },
  );
  if (!result.ok) return { error: result.error };

  jar.delete(names.session);
  if (resolved.mode === "shared") {
    jar.set(names.done, sealDone(resolved.tokenHash, result.signerId), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  return { ok: true };
}

/** Shared link on a family phone: let the next person sign. */
export async function signAnotherAction(token: string): Promise<void> {
  const db = await getDb();
  const resolved = await resolveToken(db, token);
  if (!resolved) return;
  const jar = await cookies();
  const names = cookieNames(resolved.tokenHash);
  jar.delete(names.done);
  jar.delete(names.session);
}
