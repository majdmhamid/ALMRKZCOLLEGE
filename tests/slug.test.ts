import { describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";
import { duplicateSlug, freeSlug, slugify } from "@/fields/slug";

/** A request whose payload.count() knows a fixed set of used slugs. */
function reqWith(used: Record<string, number>) {
  return {
    payload: {
      count: async ({ where }: { where: { slug: { equals: string }; id?: { not_equals: number } } }) => {
        const owner = used[where.slug.equals];
        const clash = owner !== undefined && owner !== where.id?.not_equals;
        return { totalDocs: clash ? 1 : 0 };
      },
    },
  } as unknown as PayloadRequest;
}

describe("slugs (public addresses)", () => {
  it("keeps Arabic/Hebrew letters and drops symbols and tashkeel", () => {
    expect(slugify("  دورة لحام — CO2 ")).toBe("دورة-لحام-co2");
    expect(slugify("مُدِير عَمَل")).toBe("مدير-عمل");
    expect(slugify("קורס חשמל!")).toBe("קורס-חשמל");
  });

  it("gives the second item with the same name «-2» instead of a save error", async () => {
    const req = reqWith({ "دورة-لحام": 1, "دورة-لحام-2": 2 });
    expect(await freeSlug(req, "courses", "دورة-لحام")).toBe("دورة-لحام-3");
    expect(await freeSlug(req, "courses", "دورة-لحام", 1)).toBe("دورة-لحام"); // its own slug
    expect(await freeSlug(req, "courses", "جديد")).toBe("جديد");
  });

  it("duplicating the same course twice gives two different addresses", async () => {
    const req = reqWith({ welding: 1, "welding-copy": 7 });
    const args = { value: "welding", req, collection: { slug: "courses" } } as never;
    expect(await duplicateSlug(args)).toBe("welding-copy-2");
    expect(await duplicateSlug({ value: null, req } as never)).toBeUndefined();
  });
});
