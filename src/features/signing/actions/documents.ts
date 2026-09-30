"use server";

import { revalidatePath } from "next/cache";
import { adminContext } from "@/features/signing/server/context";
import { markAllRead } from "@/features/signing/server/repo/notifications";
import { adminSign, getSavedSignature } from "@/features/signing/server/services/admin";
import { savePlacements } from "@/features/signing/server/services/editor";
import { finalizeDocument, moveDocuments, unlockDocument } from "@/features/signing/server/services/finalize";
import { getShareInfo, recordLinkCopied, regenerateLink, revokeLink } from "@/features/signing/server/services/links";
import {
  completeDocument,
  deleteDocuments,
  discardDraft,
  editDetails,
  startUpload,
  type CompleteInput,
} from "@/features/signing/server/services/documents";

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

// ---------------------------------------------------------------------------
// Placement editor
// ---------------------------------------------------------------------------

export async function savePlacementsAction(documentId: string, placements: unknown) {
  return savePlacements(await adminContext(), documentId, placements);
}

// ---------------------------------------------------------------------------
// Finalize / unlock / Signed section
// ---------------------------------------------------------------------------

export async function finalizeAction(documentId: string) {
  const result = await finalizeDocument(await adminContext(), documentId);
  revalidatePath("/admin", "layout");
  return result;
}

export async function unlockAction(documentId: string) {
  const result = await unlockDocument(await adminContext(), documentId);
  revalidatePath("/admin", "layout");
  return result;
}

export async function moveDocumentsAction(ids: string[], toSigned: boolean) {
  const result = await moveDocuments(await adminContext(), ids, toSigned);
  revalidatePath("/admin", "layout");
  return result;
}

// ---------------------------------------------------------------------------
// Admin signs too (blue pen)
// ---------------------------------------------------------------------------

export async function getSavedSignatureAction() {
  const saved = await getSavedSignature(await adminContext());
  return saved ? { url: saved.url } : null;
}

export async function adminSignAction(input: { documentId: string; useSaved: boolean; dataUrl?: string; saveToProfile: boolean }) {
  const result = await adminSign(await adminContext(), input);
  revalidatePath("/admin", "layout");
  return result;
}
