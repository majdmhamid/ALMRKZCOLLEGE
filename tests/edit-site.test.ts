/** «عدّل الموقع»: the marks the site writes in preview mode, and the list operations of the editor. */
import { describe, expect, it } from "vitest";

import { duplicateRow, moveRow, removeRow, rowTexts, topKey } from "@/admin/edit-site/ops";
import { sectionMarks, storyMarks, txt } from "@/components/site/edit-marks";
import { docOf, formHref, isVersioned, readMark, rowOf } from "@/lib/edit-marks";

const homepage = () => ({
  sections: [
    { id: "hero1", blockType: "hero", title: "كلية" },
    {
      id: "vid1",
      blockType: "videos",
      reels: [
        { id: "r1", title: "لحام", poster: 5, video: 7 },
        { id: "r2", title: "تكييف", poster: 6, video: 8 },
        { id: "r3", title: "رافعات", poster: null, video: null },
      ],
    },
  ],
});

const reels = (doc: ReturnType<typeof homepage>) => doc.sections[1].reels!.map((r) => r.id);

describe("edit marks", () => {
  it("are not written outside preview mode (public pages stay the same)", () => {
    expect(txt("homepage", "sections.#a.title", "العنوان")).toBeUndefined();
    expect(sectionMarks({ id: "a", blockType: "hero" }).t("title", "العنوان")).toBeUndefined();
    expect(storyMarks({ id: 1, graduateName: "x" })).toBeUndefined();
  });

  it("reads a mark and knows its document", () => {
    const m = readMark(JSON.stringify({ d: "success-stories/12", p: "quote", k: "textarea", l: "الاقتباس" }));
    expect(m?.d).toBe("success-stories/12");
    expect(readMark("not json")).toBeNull();
    expect(readMark(JSON.stringify({ d: 1 }))).toBeNull();
    expect(docOf("homepage")).toEqual({ global: "homepage" });
    expect(docOf("courses/5")).toEqual({ collection: "courses", id: "5" });
    expect(formHref("courses/5")).toBe("/admin/collections/courses/5");
    expect(formHref("homepage")).toBe("/admin/globals/homepage");
    expect(isVersioned("homepage")).toBe(true);
    expect(isVersioned("staff/3")).toBe(false);
  });

  it("finds the list row of a path, but never the homepage sections themselves", () => {
    expect(rowOf("sections.#vid1.reels.#r2.title")).toEqual({ list: "sections.#vid1.reels", row: "r2" });
    expect(rowOf("sections.#vid1.reels.#r2")).toEqual({ list: "sections.#vid1.reels", row: "r2" });
    expect(rowOf("topics.#t1.topic")).toEqual({ list: "topics", row: "t1" });
    expect(rowOf("sections.#vid1.title")).toBeNull();
    expect(rowOf("quote")).toBeNull();
    expect(topKey("sections.#vid1.reels.#r2.title")).toBe("sections");
  });
});

describe("list operations", () => {
  it("moves a row by its id", () => {
    const doc = homepage();
    expect(moveRow(doc, "sections.#vid1.reels", "r2", -1)).toBe(true);
    expect(reels(doc)).toEqual(["r2", "r1", "r3"]);
    expect(moveRow(doc, "sections.#vid1.reels", "r2", -1)).toBe(false);
    expect(moveRow(doc, "sections.#vid1.reels", "r3", 1)).toBe(false);
  });

  it("removes a row", () => {
    const doc = homepage();
    expect(removeRow(doc, "sections.#vid1.reels", "r1")).toBe(true);
    expect(reels(doc)).toEqual(["r2", "r3"]);
    expect(removeRow(doc, "sections.#vid1.reels", "nope")).toBe(false);
  });

  it("copies a row right after it, with a new id and the same content", () => {
    const doc = homepage();
    const id = duplicateRow(doc, "sections.#vid1.reels", "r1", "new1");
    expect(id).toBe("new1");
    expect(reels(doc)).toEqual(["r1", "new1", "r2", "r3"]);
    expect(doc.sections[1].reels![1]).toEqual({ id: "new1", title: "لحام", poster: 5, video: 7 });
    expect(duplicateRow(doc, "sections.#vid1.missing", "r1")).toBeNull();
  });

  it("gives the copy the texts of the other language", () => {
    const he = { id: "r1", title: "ריתוך", poster: 5, durationLabel: "0:12" };
    expect(rowTexts(he, "sections.#vid1.reels.#new1")).toEqual({
      "sections.#vid1.reels.#new1.title": "ריתוך",
      "sections.#vid1.reels.#new1.durationLabel": "0:12",
    });
  });
});
