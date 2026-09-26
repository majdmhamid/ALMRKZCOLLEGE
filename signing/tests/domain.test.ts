import { describe, expect, it } from "vitest";
import {
  allSigned,
  documentBadges,
  groupByMonthDay,
  localDayKey,
  nextStatus,
  sharedLinkOpen,
} from "@/lib/domain";
import { formatPhone, normalizePhone } from "@/lib/phone";

type S = { status: "pending" | "signed"; is_admin: boolean };
const client = (signed = false): S => ({ status: signed ? "signed" : "pending", is_admin: false });
const admin = (signed = false): S => ({ status: signed ? "signed" : "pending", is_admin: true });

const doc = (over: Partial<Parameters<typeof documentBadges>[0]> = {}) => ({
  link_mode: "per_signer" as const,
  max_signers: null,
  admin_signs: false,
  status: "pending" as const,
  signers: [client()],
  ...over,
});

describe("status rules", () => {
  it("per-signer: signed only when every client signed", () => {
    expect(allSigned(doc({ signers: [client(true), client()] }))).toBe(false);
    expect(allSigned(doc({ signers: [client(true), client(true)] }))).toBe(true);
  });

  it("admin signing is required when admin_signs is on", () => {
    const d = doc({ admin_signs: true, signers: [client(true), admin()] });
    expect(allSigned(d)).toBe(false);
    expect(documentBadges(d)).toEqual(["admin"]);
    expect(allSigned({ ...d, signers: [client(true), admin(true)] })).toBe(true);
  });

  it("shared with a maximum needs that many; without one, at least one", () => {
    const withMax = doc({ link_mode: "shared", max_signers: 3, signers: [client(true), client(true)] });
    expect(allSigned(withMax)).toBe(false);
    expect(sharedLinkOpen(withMax)).toBe(true);
    const full = { ...withMax, signers: [client(true), client(true), client(true)] };
    expect(allSigned(full)).toBe(true);
    expect(sharedLinkOpen(full)).toBe(false);

    const open = doc({ link_mode: "shared", signers: [] });
    expect(allSigned(open)).toBe(false);
    expect(documentBadges(open)).toEqual(["waiting"]);
    expect(allSigned({ ...open, signers: [client(true)] })).toBe(true);
    expect(sharedLinkOpen({ ...open, signers: [client(true)] })).toBe(true);
  });

  it("shows both badges when the admin and a client are pending", () => {
    expect(documentBadges(doc({ admin_signs: true, signers: [client(), admin()] }))).toEqual(["admin", "waiting"]);
  });

  it("never moves draft or finalized documents", () => {
    expect(nextStatus(doc({ status: "draft", signers: [client(true)] }))).toBe("draft");
    expect(nextStatus(doc({ status: "finalized", signers: [client()] }))).toBe("finalized");
    expect(documentBadges(doc({ status: "finalized" }))).toEqual(["finalized"]);
    expect(nextStatus(doc({ signers: [client(true)] }))).toBe("signed");
    expect(sharedLinkOpen(doc({ link_mode: "shared", status: "finalized", signers: [] }))).toBe(false);
  });
});

describe("month → day grouping", () => {
  it("uses Israel time for day boundaries", () => {
    // 22:30 UTC on Sep 30 is already Oct 1 in Israel (UTC+3).
    expect(localDayKey("2026-09-30T22:30:00Z")).toBe("2026-10-01");
    expect(localDayKey("2026-09-30T20:30:00Z")).toBe("2026-09-30");
  });

  it("groups newest first by month, then day", () => {
    const items = [
      { id: "a", at: "2026-08-15T10:00:00Z" },
      { id: "b", at: "2026-09-26T08:00:00Z" },
      { id: "c", at: "2026-09-26T12:00:00Z" },
      { id: "d", at: "2026-09-02T12:00:00Z" },
    ];
    const months = groupByMonthDay(items, (i) => i.at);
    expect(months.map((m) => [m.key, m.count])).toEqual([
      ["2026-09", 3],
      ["2026-08", 1],
    ]);
    expect(months[0].days.map((d) => [d.key, d.items.map((i) => i.id)])).toEqual([
      ["2026-09-26", ["c", "b"]],
      ["2026-09-02", ["d"]],
    ]);
  });
});

describe("phone numbers for WhatsApp", () => {
  it.each([
    ["052-555-1234", "972525551234"],
    ["0525551234", "972525551234"],
    ["+972 52 555 1234", "972525551234"],
    ["00972525551234", "972525551234"],
    ["9720525551234", "972525551234"],
    ["04-6111111", "97246111111"],
    ["+1 (212) 555-0100", "12125550100"],
  ])("%s → %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("rejects junk and formats Israeli mobiles", () => {
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("12")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(formatPhone("972525551234")).toBe("052-555-1234");
    expect(formatPhone("12125550100")).toBe("+12125550100");
  });
});
