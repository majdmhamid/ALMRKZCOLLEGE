/**
 * قواعد الكلية الثابتة (CLAUDE.md) — تُفحص قبل النشر:
 *  1. ممنوع أي صياغة توحي بضمان تشغيل.
 *  2. ممنوع عرض أسعار.
 * الفحص يشتغل على كل نص في المحتوى، ويرجّع مكان المشكلة بلغة مفهومة.
 */
import type { SiteContent } from "./schema";

export interface RuleIssue {
  rule: "guarantee" | "price";
  /** مسار الحقل داخل المحتوى، مثل courses.3.summary.ar */
  path: string;
  /** النص المخالف (مقطع قصير) */
  match: string;
}

const GUARANTEE = [
  /ضما[نن]\s*(ال)?(تشغيل|عمل|وظيف)/,
  /(شغل|عمل|وظيفة|تشغيل)\s*(ال)?مضمون/,
  /مضمون\s*(ال)?(شغل|عمل|وظيفة|تشغيل)/,
  /نضمن\s*(لك|لكم)?\s*(ال)?(شغل|عمل|وظيف|تشغيل)/,
  /تأمين\s*(مكان\s*)?عمل\s*(مضمون|لكل)/,
  /הבטחת\s*תעסוקה/,
  /(תעסוקה|עבודה|משרה)\s*מובטחת/,
  /מובטחת?\s*(תעסוקה|עבודה|משרה)/,
  /מבטיחים\s*(לכם\s*)?(עבודה|תעסוקה|משרה)/,
  /job\s*guarantee|guaranteed\s*(job|employment)/i,
];

const PRICE = [/₪/, /\d[\d,.]*\s*(شيكل|شواكل|ش\.ج|ש"ח|ש״ח|שקל|שקלים|NIS|ILS)/i, /(شيكل|שקל)\s*\d/, /(السعر|سعر\s*الدورة|מחיר\s*הקורס)\s*[:：]?\s*\d/];

/** نصوص مسموح فيها كلمة "سعر" لأنها تقول "تواصل معنا للسعر" — لا تُفحص إلا بالأنماط الرقمية أعلاه */

function walk(value: unknown, path: string, out: { path: string; text: string }[]) {
  if (typeof value === "string") out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}.${i}`, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, out);
}

export function checkText(text: string): RuleIssue["rule"] | null {
  if (GUARANTEE.some((r) => r.test(text))) return "guarantee";
  if (PRICE.some((r) => r.test(text))) return "price";
  return null;
}

export function checkContent(content: Partial<SiteContent>): RuleIssue[] {
  const strings: { path: string; text: string }[] = [];
  walk(content, "", strings);
  const issues: RuleIssue[] = [];
  for (const s of strings) {
    // الروابط والمسارات ما بتنفحص
    if (/^(https?:|\/|mailto:|tel:)/.test(s.text)) continue;
    for (const [rule, patterns] of [["guarantee", GUARANTEE], ["price", PRICE]] as const) {
      for (const r of patterns) {
        const m = s.text.match(r);
        if (m) {
          const i = m.index ?? 0;
          issues.push({ rule, path: s.path, match: s.text.slice(Math.max(0, i - 20), i + m[0].length + 20) });
          break;
        }
      }
    }
  }
  return issues;
}

/** عناصر ناقصة (بدون اسم عربي أو بدون صورة) — ما بتنفع تنتشر هيك */
export interface MissingIssue {
  path: string;
  what: "name" | "image";
}

export function checkMissing(content: SiteContent): MissingIssue[] {
  const out: MissingIssue[] = [];
  const named: [keyof SiteContent, string, string | null][] = [
    ["graduates", "name", "image"],
    ["staff", "name", "image"],
    ["partners", "name", "image"],
    ["courses", "name", "image"],
    ["groups", "name", "image"],
    ["news", "title", null],
    ["reels", "title", "poster"],
  ];
  for (const [section, nameKey, imageKey] of named) {
    ((content[section] as unknown as Record<string, unknown>[]) ?? []).forEach((it, i) => {
      const name = it[nameKey] as { ar?: string } | undefined;
      if (!name?.ar?.trim()) out.push({ path: `${String(section)}.${i}`, what: "name" });
      if (imageKey && !String(it[imageKey] ?? "").trim()) out.push({ path: `${String(section)}.${i}`, what: "image" });
    });
  }
  return out;
}

export const RULE_LABEL: Record<RuleIssue["rule"], string> = {
  guarantee: "صياغة توحي بضمان تشغيل — ممنوعة. المسموح: «مرافقة وتوجيه مهني بعد التخرّج».",
  price: "سعر ظاهر — الأسعار لا تُعرض على الموقع. المسموح: «تواصل معنا لمعرفة السعر».",
};
