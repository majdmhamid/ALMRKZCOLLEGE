/**
 * Shapes shared by server and client, plus pure rules about document status.
 * Nothing secret ever goes in these types (no token hashes, no ID hashes).
 */
import type { DocumentStatus, LinkMode, SignatureMethod, SignerStatus } from "./database.types";

export type { DocumentStatus, LinkMode, SignatureMethod, SignerStatus };

export type SignerSummary = {
  id: string;
  name: string;
  status: SignerStatus;
  is_admin: boolean;
  phone: string | null;
  id_last3: string | null;
  locked: boolean;
  failed_attempts: number;
  signed_at: string | null;
  signature_method: SignatureMethod | null;
  /** Per-signer mode: a live link exists (not revoked). */
  has_link: boolean;
};

export type DocumentListItem = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  file_name: string | null;
  original_size_bytes: number | null;
  final_size_bytes: number | null;
  page_count: number | null;
  has_file: boolean;
  link_mode: LinkMode;
  max_signers: number | null;
  admin_signs: boolean;
  status: DocumentStatus;
  in_signed_section: boolean;
  moved_to_signed_at: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
  /** Shared mode: a live shared link exists (not revoked). */
  has_shared_link: boolean;
  signers: SignerSummary[];
};

export type DocumentStats = {
  total: number;
  signed: number;
  waiting: number;
  finalized: number;
  storage_bytes: number;
  file_count: number;
};

export type SettingsDto = {
  allow_typed_signature: boolean;
  allow_checkbox_signature: boolean;
  default_link_mode: LinkMode;
  message_template: string;
};

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_ID_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Status rules
// ---------------------------------------------------------------------------

type StatusInput = {
  link_mode: LinkMode;
  max_signers: number | null;
  admin_signs: boolean;
  signers: Pick<SignerSummary, "status" | "is_admin">[];
};

/** Client signers expected: per-signer = the list; shared = max (null = open-ended). */
export function expectedClientSigners(doc: StatusInput): number | null {
  if (doc.link_mode === "per_signer") return doc.signers.filter((s) => !s.is_admin).length;
  return doc.max_signers;
}

export function signedClientCount(doc: StatusInput): number {
  return doc.signers.filter((s) => !s.is_admin && s.status === "signed").length;
}

export function adminPending(doc: StatusInput): boolean {
  return doc.admin_signs && !doc.signers.some((s) => s.is_admin && s.status === "signed");
}

/**
 * Every expected signature is in, so the document can be finalized.
 * Shared mode without a maximum: at least one client signed.
 */
export function allSigned(doc: StatusInput): boolean {
  if (adminPending(doc)) return false;
  const expected = expectedClientSigners(doc);
  const signed = signedClientCount(doc);
  if (expected === null) return signed >= 1;
  return signed >= expected;
}

/** Shared link still accepts new signers. */
export function sharedLinkOpen(doc: StatusInput & { status: DocumentStatus }): boolean {
  if (doc.link_mode !== "shared" || doc.status === "finalized" || doc.status === "draft") return false;
  return doc.max_signers === null || signedClientCount(doc) < doc.max_signers;
}

/** The stored status after a change to signers (never touches draft/finalized). */
export function nextStatus(doc: StatusInput & { status: DocumentStatus }): DocumentStatus {
  if (doc.status === "draft" || doc.status === "finalized") return doc.status;
  return allSigned(doc) ? "signed" : "pending";
}

export type BadgeKind = "draft" | "admin" | "waiting" | "signed" | "finalized";

/** Badges shown on a row. "admin" and "waiting" can both show at once. */
export function documentBadges(doc: StatusInput & { status: DocumentStatus }): BadgeKind[] {
  if (doc.status === "draft") return ["draft"];
  if (doc.status === "finalized") return ["finalized"];
  const badges: BadgeKind[] = [];
  if (adminPending(doc)) badges.push("admin");
  const expected = expectedClientSigners(doc);
  const signed = signedClientCount(doc);
  if (expected === null ? signed === 0 : signed < expected) badges.push("waiting");
  if (badges.length === 0) badges.push("signed");
  return badges;
}

// ---------------------------------------------------------------------------
// Month → day grouping
// ---------------------------------------------------------------------------

export type DayGroup<T> = { key: string; date: string; items: T[] };
export type MonthGroup<T> = { key: string; date: string; days: DayGroup<T>[]; count: number };

const TZ = "Asia/Jerusalem";
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** "2026-09-26" in Israel time — day boundaries follow the office clock, not UTC. */
export function localDayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso));
}

/** Groups newest-first by month, then by day. `dateOf` picks which timestamp to group by. */
export function groupByMonthDay<T>(items: T[], dateOf: (item: T) => string): MonthGroup<T>[] {
  const sorted = [...items].sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
  const months: MonthGroup<T>[] = [];
  for (const item of sorted) {
    const iso = dateOf(item);
    const dayKey = localDayKey(iso);
    const monthKey = dayKey.slice(0, 7);
    let month = months.at(-1);
    if (!month || month.key !== monthKey) {
      month = { key: monthKey, date: iso, days: [], count: 0 };
      months.push(month);
    }
    let day = month.days.at(-1);
    if (!day || day.key !== dayKey) {
      day = { key: dayKey, date: iso, items: [] };
      month.days.push(day);
    }
    day.items.push(item);
    month.count++;
  }
  return months;
}
