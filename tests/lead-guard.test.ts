import { afterEach, describe, expect, it, vi } from "vitest";
import { LEAD_RATE, isTooFast, leadRateOk } from "@/components/site/lead-guard";

describe("lead form spam checks", () => {
  afterEach(() => vi.useRealTimers());

  it("refuses a form sent faster than a person can type", () => {
    expect(isTooFast("0")).toBe(true);
    expect(isTooFast("1200")).toBe(true);
    expect(isTooFast("3000")).toBe(false);
    expect(isTooFast("45000")).toBe(false);
  });

  it("lets the lead through when the timing is missing or odd", () => {
    for (const v of ["", "-5", "abc", "1e3", "12.5", "9999999999"]) expect(isTooFast(v)).toBe(false);
  });

  it("allows 5 leads per IP in the window, refuses the 6th, other IPs unaffected", async () => {
    // Middle of a 10-minute window, so the test never straddles two windows.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-28T10:05:00Z"));
    const ip = "203.0.113.7";
    for (let i = 0; i < LEAD_RATE.max; i++) expect(await leadRateOk(ip)).toBe(true);
    expect(await leadRateOk(ip)).toBe(false);
    expect(await leadRateOk("203.0.113.8")).toBe(true);
  });

  it("never blocks when the IP is unknown", async () => {
    for (let i = 0; i < 10; i++) expect(await leadRateOk(null)).toBe(true);
  });
});
