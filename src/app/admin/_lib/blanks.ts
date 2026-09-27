import type { Course, Group, NewsPost } from "@content/types";

/** صورة مؤقتة لعنصر جديد بدون صورة */
export const PLACEHOLDER_IMAGE = "/images/placeholder.webp";

/** قيم البداية لدورة جديدة (تتعدّل كلها بعدين) */
export function blankCourse(group: Group, slug: string, order: number): Course {
  return {
    slug,
    group: group.slug,
    legacyId: 0,
    order,
    name: { ar: "", he: "" },
    summary: { ar: "", he: "" },
    headline: { ar: "", he: "" },
    hours: 0,
    sessions: 0,
    schedule: { ar: "مسائي · 17:00–21:00", he: "ערב · 17:00–21:00" },
    audience: { ar: "", he: "" },
    description: { ar: [], he: [] },
    topics: { ar: [""], he: [""] },
    requirements: { ar: [""], he: [""] },
    certificate: { ar: "شهادة إتمام من كلية المركز.", he: "תעודת סיום מטעם מכללת המרכז." },
    scholarship: true,
    image: group.image,
    featured: false,
  };
}

export function blankGroup(slug: string, order: number): Group {
  return {
    slug,
    order,
    name: { ar: "", he: "" },
    shortName: { ar: "", he: "" },
    tagline: { ar: "", he: "" },
    description: { ar: "", he: "" },
    icon: "/images/icons/welding.png",
    image: PLACEHOLDER_IMAGE,
  };
}

export function blankNews(slug: string): NewsPost {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    slug,
    date: iso,
    title: { ar: "", he: "" },
    excerpt: { ar: "", he: "" },
    body: { ar: [""], he: [""] },
    images: [PLACEHOLDER_IMAGE],
  };
}
