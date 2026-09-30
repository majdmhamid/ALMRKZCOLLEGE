/** Homepage success stories: one rule («اعرضها بالرئيسية» + order), no hidden quote rule, card state, old hand-picked list. */
import { describe, expect, it } from "vitest";
import {
  FEATURED_NEEDS_PHOTO,
  SKIP_PHOTO_RULE,
  homeState,
  homeStories,
  storiesChosenOnHomepage,
  storyText,
  validateFeatured,
} from "@/lib/home-stories";

describe("homeStories", () => {
  it("keeps only featured stories, by order (ties keep their place)", () => {
    const list = [
      { id: 1, featured: true, order: 3 },
      { id: 2, featured: false, order: 1 },
      { id: 3, featured: true, order: 1 },
      { id: 4, featured: true, order: 3 },
      { id: 5, featured: null, order: 0 },
    ];
    expect(homeStories(list).map((s) => s.id)).toEqual([3, 1, 4]);
  });

  it("shows a featured story without a quote (no hidden rule)", () => {
    expect(homeStories([{ id: 1, featured: true, quote: null }])).toHaveLength(1);
  });
});

describe("storyText", () => {
  it("uses the quote and the excerpt when there", () => {
    expect(storyText({ quote: " كلام ", excerpt: "قصة" })).toEqual({ quote: "كلام", body: "قصة" });
  });
  it("falls back to the excerpt, or nothing (name + photo only)", () => {
    expect(storyText({ quote: "  ", excerpt: "قصة" })).toEqual({ quote: null, body: "قصة" });
    expect(storyText({})).toEqual({ quote: null, body: null });
  });
});

describe("homeState (card badge)", () => {
  it("compares the latest version with the live one", () => {
    expect(homeState(true, true)).toBe("shown");
    expect(homeState(true, false)).toBe("willShow");
    expect(homeState(false, true)).toBe("willHide");
    expect(homeState(false, false)).toBe("hidden");
  });
});

describe("storiesChosenOnHomepage", () => {
  it("collects ids (numbers or populated docs) from the old stories block, once each", () => {
    const sections = [
      { blockType: "hero" },
      { blockType: "successStories", stories: [2, { id: 5 }, 2] },
      { blockType: "successStories", stories: null },
      { blockType: "featuredCourses", courses: [9] },
    ];
    expect(storiesChosenOnHomepage(sections)).toEqual([2, 5]);
    expect(storiesChosenOnHomepage(undefined)).toEqual([]);
  });
});

describe("validateFeatured", () => {
  it("a story on the homepage needs a photo", () => {
    expect(validateFeatured(true, { siblingData: {} })).toBe(FEATURED_NEEDS_PHOTO);
    expect(validateFeatured(true, { siblingData: { photo: 4 } })).toBe(true);
    expect(validateFeatured(false, { siblingData: {} })).toBe(true);
  });
  it("except in the one-time move of the old hand-picked stories", () => {
    expect(validateFeatured(true, { siblingData: {}, req: { context: { [SKIP_PHOTO_RULE]: true } } })).toBe(true);
  });
});
