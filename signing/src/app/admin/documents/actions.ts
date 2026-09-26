"use server";

import { revalidatePath } from "next/cache";
import { adminContext } from "@/server/context";
import { markAllRead } from "@/server/repo/notifications";
import { getShareInfo, recordLinkCopied, regenerateLink, resetLock, revokeLink } from "@/server/services/links";
import {
  completeDocument,
  deleteDocuments,
  discardDraft,
  editDetails,
  startUpload,
  type CompleteInput,
} from "@/server/services/documents";

export async function startUploadAction(input: { fileName: string; size: number; linkMode: "per_signer" | "shared" }) {
  return startUpload(await adminContext(), input);
}

export async function completeDocumentAction(input: CompleteInput) {
  const result = await completeDocument(await adminContext(), input);
  if (result.ok) revalidatePath("/admin/documents");
  return result;
}

export async function discardDraftAction(documentId: string) {
  await discardDraft(await adminContext(), documentId);
  revalidatePath("/admin/documents");
}

export async function editDetailsAction(input: {
  documentId: string;
  title: string;
  category: string | null;
  description: string | null;
}) {
  const result = await editDetails(await adminContext(), input);
  if (result.ok) revalidatePath("/admin", "layout");
  return result;
}

export async function deleteDocumentsAction(ids: string[]) {
  const result = await deleteDocuments(await adminContext(), ids);
  if (result.ok) revalidatePath("/admin", "layout");
  return result;
}

export async function markNotificationsReadAction() {
  const { db } = await adminContext();
  await markAllRead(db);
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------------------
// Signing links
// ---------------------------------------------------------------------------

type LinkRef = { documentId: string; signerId: string | null };

export async function getShareInfoAction(documentId: string) {
  return getShareInfo(await adminContext(), documentId);
}

export async function recordLinkCopiedAction(ref: LinkRef) {
  await recordLinkCopied(await adminContext(), ref);
}

export async function revokeLinkAction(ref: LinkRef) {
  const result = await revokeLink(await adminContext(), ref);
  revalidatePath("/admin", "layout");
  return result;
}

export async function regenerateLinkAction(ref: LinkRef) {
  const result = await regenerateLink(await adminContext(), ref);
  revalidatePath("/admin", "layout");
  return result;
}

export async function resetLockAction(ref: LinkRef) {
  const result = await resetLock(await adminContext(), ref);
  revalidatePath("/admin", "layout");
  return result;
}
