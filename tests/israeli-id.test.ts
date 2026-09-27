import { describe, expect, it } from "vitest";
import { idLast3, isValidIsraeliId, normalizeIsraeliId } from "@/features/signing/lib/security/israeli-id";

describe("Israeli ID check digit", () => {
  it.each(["123456782", "000000018", "18", "039337423", "  123-456-782 "])("accepts valid %s", (id) => {
    expect(isValidIsraeliId(id)).toBe(true);
  });

  it.each(["123456789", "000000019", "", "000000000", "0", "12345678901", "12a456782", "١٢٣٤٥٦٧٨٢"])(
    "rejects %s",
    (id) => {
      expect(isValidIsraeliId(id)).toBe(false);
    },
  );

  it("pads short IDs to 9 digits", () => {
    expect(normalizeIsraeliId("18")).toBe("000000018");
    expect(normalizeIsraeliId("123 456 782")).toBe("123456782");
    expect(normalizeIsraeliId("1234567890")).toBeNull();
  });

  it("returns the last 3 digits of the normalized ID", () => {
    expect(idLast3("18")).toBe("018");
    expect(idLast3("123456782")).toBe("782");
  });
});
