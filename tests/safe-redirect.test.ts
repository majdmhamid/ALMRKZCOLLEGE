import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/preview";

describe("preview redirect paths (/next/preview, /next/exit-preview)", () => {
  it("keeps paths on this site", () => {
    expect(safeRedirectPath("/ar")).toBe("/ar");
    expect(safeRedirectPath("/ar/course/%D9%84%D8%AD%D8%A7%D9%85?x=1#graduates")).toBe(
      "/ar/course/%D9%84%D8%AD%D8%A7%D9%85?x=1#graduates",
    );
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
  });

  it("refuses anything a browser would open on another site", () => {
    for (const bad of [
      "//evil.com",
      "/\\evil.com",
      "/\\/evil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "evil.com",
    ]) {
      expect(safeRedirectPath(bad), bad).toBeNull();
    }
  });
});
