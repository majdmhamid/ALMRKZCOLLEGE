"use server";

import { revalidatePath } from "next/cache";
import type { SettingsDto } from "@/features/signing/lib/domain";
import { adminContext } from "@/features/signing/server/context";
import { deleteProfileSignature, saveProfileSignature, saveSettings } from "@/features/signing/server/services/admin";

export async function saveSettingsAction(input: SettingsDto) {
  const result = await saveSettings(await adminContext(), input);
  revalidatePath("/admin", "layout");
  return result;
}

export async function saveProfileSignatureAction(dataUrl: string) {
  const result = await saveProfileSignature(await adminContext(), dataUrl);
  revalidatePath("/admin/settings");
  return result;
}

export async function deleteProfileSignatureAction() {
  await deleteProfileSignature(await adminContext());
  revalidatePath("/admin/settings");
}
