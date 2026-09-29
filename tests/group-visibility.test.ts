import { describe, expect, it } from "vitest";
import { groupState, groupsWithPublishedCourses, groupStateText } from "@/lib/group-visibility";

describe("when a course group (مجال) shows on the website", () => {
  const courses = [
    { group: 1, _status: "published" },
    { group: { id: 2 }, _status: "published" },
    { group: 3, _status: "draft" },
    { group: null, _status: "published" },
  ];
  const withCourses = groupsWithPublishedCourses(courses);

  it("only groups with a published course count", () => {
    expect([...withCourses].sort()).toEqual([1, 2]);
  });

  it("published + a published course = visible; otherwise says why it is hidden", () => {
    expect(groupState("published", withCourses.has(1))).toBe("visible");
    expect(groupState("published", withCourses.has(3))).toBe("noCourses");
    expect(groupState("draft", withCourses.has(1))).toBe("draft");
    expect(groupState(undefined, false)).toBe("draft");
  });

  it("has Arabic and Hebrew texts for every state", () => {
    for (const lang of ["ar", "he"]) {
      const t = groupStateText(lang);
      for (const k of ["visible", "noCourses", "draft", "savedNoCourses"] as const) expect(t[k]).toBeTruthy();
    }
    expect(groupStateText("he").visible).toBe("מוצג באתר");
    expect(groupStateText(undefined).visible).toBe("ظاهر بالموقع");
  });
});
