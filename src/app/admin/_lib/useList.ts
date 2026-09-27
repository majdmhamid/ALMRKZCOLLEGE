"use client";

import { useCallback } from "react";
import { itemStatus } from "@/lib/cms/diff";
import { itemKey, type ListKey, type SiteContent } from "@/lib/cms/schema";
import { useAdmin } from "./store";

type Item<K extends ListKey> = SiteContent[K][number];

/** أدوات تعديل قائمة (خريجون، طاقم، شركاء، دورات...) بالمفتاح الثابت لكل عنصر */
export function useList<K extends ListKey>(section: K) {
  const { draft, update, published, toast } = useAdmin();
  const items = draft[section] as Item<K>[];
  const keyOf = useCallback((it: Item<K>) => itemKey(section, it), [section]);
  const write = useCallback((fn: (prev: Item<K>[]) => Item<K>[]) => update(section, ((prev: Item<K>[]) => fn(prev)) as never), [update, section]);

  return {
    items,
    keyOf,
    get: (key: string) => items.find((x) => keyOf(x) === key),
    patch: (key: string, patch: Partial<Item<K>>) => write((prev) => prev.map((x) => (keyOf(x) === key ? ({ ...x, ...patch } as Item<K>) : x))),
    replace: (key: string, next: Item<K>) => write((prev) => prev.map((x) => (keyOf(x) === key ? next : x))),
    add: (item: Item<K>, at: "start" | "end" = "end") => write((prev) => (at === "start" ? [item, ...prev] : [...prev, item])),
    remove: (key: string, label: string) => {
      const before = items;
      write((prev) => prev.filter((x) => keyOf(x) !== key));
      toast({ message: `انحذف: ${label}`, undo: () => update(section, before as never) });
    },
    move: (fromKey: string, toKey: string) =>
      write((prev) => {
        const from = prev.findIndex((x) => keyOf(x) === fromKey);
        const to = prev.findIndex((x) => keyOf(x) === toKey);
        if (from < 0 || to < 0 || from === to) return prev;
        const out = [...prev];
        const [it] = out.splice(from, 1);
        out.splice(to, 0, it);
        return out;
      }),
    status: (it: Item<K>) => itemStatus(published, section, it),
  };
}

/** مفتاح قصير عشوائي لعنصر جديد */
export const newKey = (prefix: string) => `${prefix}-${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}`;

const AR_LATIN: Record<string, string> = {
  ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "a", و: "w", ي: "y", ى: "a", ئ: "e", ؤ: "o", ء: "",
};

/** رابط مقروء من اسم عربي: «دورة لحام أرغون» → «dwra-lham-arghwn» (يمكن تعديله) */
export function slugify(text: string, fallbackPrefix: string, taken: string[]): string {
  const base =
    text
      .trim()
      .toLowerCase()
      .split("")
      .map((ch) => AR_LATIN[ch] ?? ch)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || newKey(fallbackPrefix);
  let slug = base;
  for (let i = 2; taken.includes(slug); i++) slug = `${base}-${i}`;
  return slug;
}
