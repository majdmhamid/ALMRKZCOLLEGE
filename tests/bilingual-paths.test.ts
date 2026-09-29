/** Arabic + Hebrew side by side in the admin: form paths → stable row-id paths, read/write on the other locale's doc. */
import { describe, expect, it } from "vitest";
import { getAt, setAt, toIdPath } from "@/admin/bilingual/paths";

const rows: Record<string, string> = { sections: "", "sections.2": "blk-c", "sections.2.items.0": "row-a" };
const rowId = (prefix: string) => rows[prefix];

describe("bilingual paths", () => {
  it("replaces row indexes with row ids", () => {
    expect(toIdPath("name", rowId)).toBe("name");
    expect(toIdPath("seo.title", rowId)).toBe("seo.title");
    expect(toIdPath("sections.2.items.0.question", rowId)).toBe("sections.#blk-c.items.#row-a.question");
  });

  it("gives up when a row has no id yet", () => {
    expect(toIdPath("sections.5.title", rowId)).toBeNull();
  });

  it("reads and writes by row id, whatever the order", () => {
    const doc: Record<string, unknown> = {
      seo: null,
      sections: [
        { id: "blk-x", title: "x" },
        { id: "blk-c", title: "c", items: [{ id: "row-a", question: null }] },
      ],
    };
    expect(getAt(doc, "sections.#blk-c.title")).toBe("c");
    expect(setAt(doc, "sections.#blk-c.items.#row-a.question", "שאלה")).toBe(true);
    expect(getAt(doc, "sections.#blk-c.items.#row-a.question")).toBe("שאלה");
    // a group that is still empty in this language
    expect(setAt(doc, "seo.title", "כותרת")).toBe(true);
    expect(doc.seo).toEqual({ title: "כותרת" });
    // a deleted row is skipped
    expect(setAt(doc, "sections.#gone.title", "x")).toBe(false);
  });
});
