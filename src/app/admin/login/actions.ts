"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/features/signing/server/auth";
import { rateLimit } from "@/features/signing/server/rate-limit";
import { requestInfo } from "@/features/signing/server/request-info";

export type LoginState = { error?: "invalid" | "not_admin" | "rateLimited" };

const schema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "invalid" };

  const { ip } = await requestInfo();
  const allowed = await rateLimit(`login:${ip ?? "unknown"}`, 10 * 60, 10);
  if (!allowed) return { error: "rateLimited" };

  const result = await signIn(parsed.data.email, parsed.data.password);
  if (result !== "ok") return { error: result };
  redirect("/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin/login");
}
