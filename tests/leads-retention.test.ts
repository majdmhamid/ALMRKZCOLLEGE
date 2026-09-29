import { describe, expect, it } from "vitest";
import { leadRetentionMonths, DEFAULT_LEADS_RETENTION_MONTHS } from "@/components/site/notice-text";
import { retentionCutoff } from "@/lib/leads-retention";

describe("lead retention (privacy)", () => {
  it("uses the months from site settings, or 24 when missing or out of range", () => {
    expect(leadRetentionMonths(12)).toBe(12);
    expect(leadRetentionMonths(84)).toBe(84);
    expect(leadRetentionMonths(6.4)).toBe(6);
    for (const v of [undefined, null, 0, -3, 85, 1000]) expect(leadRetentionMonths(v)).toBe(DEFAULT_LEADS_RETENTION_MONTHS);
  });

  it("computes the cutoff date N months back", () => {
    const now = new Date("2026-09-29T03:30:00Z");
    expect(retentionCutoff(24, now).toISOString()).toBe("2024-09-29T03:30:00.000Z");
    expect(retentionCutoff(1, now).toISOString()).toBe("2026-08-29T03:30:00.000Z");
    // Month arithmetic over a year boundary.
    expect(retentionCutoff(10, new Date("2026-03-15T00:00:00Z")).toISOString()).toBe("2025-05-15T00:00:00.000Z");
  });
});
