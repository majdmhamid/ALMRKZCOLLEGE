import { describe, expect, it } from "vitest";
import { internationalPhone, openingHoursSpecification, parseDays } from "@/lib/schema-format";

describe("structured data formats", () => {
  it("reads day ranges and lists in Arabic and Hebrew", () => {
    expect(parseDays("الأحد – الخميس")).toEqual(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]);
    expect(parseDays("ראשון – חמישי")).toEqual(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]);
    expect(parseDays("ראשון עד חמישי")).toHaveLength(5);
    expect(parseDays("الجمعة والسبت")).toEqual(["Friday", "Saturday"]);
    expect(parseDays("الجمعة، السبت")).toEqual(["Friday", "Saturday"]);
    expect(parseDays("كل يوم تقريباً")).toEqual([]);
  });

  it("keeps only lines with clear days and times", () => {
    expect(
      openingHoursSpecification([
        { days: "الأحد – الخميس", hours: "8:00 – 16:00" },
        { days: "الأحد – الخميس", hours: "للاستفسار عن ساعات الاستقبال تواصل معنا" },
        { days: "الجمعة", hours: "مغلق" },
      ]),
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((d) => `https://schema.org/${d}`),
        opens: "08:00",
        closes: "16:00",
      },
    ]);
  });

  it("writes Israeli phone numbers in international form", () => {
    expect(internationalPhone("04-6116800")).toBe("+972-4-6116800");
    expect(internationalPhone("054-6174339")).toBe("+972-54-6174339");
    expect(internationalPhone("+972 54 617 4339")).toBe("+972 54 617 4339");
    expect(internationalPhone("972546174339")).toBe("+972-546174339");
    expect(internationalPhone("")).toBeUndefined();
  });
});
