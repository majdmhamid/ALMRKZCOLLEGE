"use server";

import { site } from "@content/site";
import { getCourse } from "@content/courses";

/**
 * استقبال استمارة "سجّل اهتمامك".
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ وين نعبّي مفاتيح الإرسال لاحقاً؟                                       │
 * │ في ملف .env.local (محلياً) أو في إعدادات Vercel (Environment Variables): │
 * │   RESEND_API_KEY   = مفتاح من https://resend.com (خدمة إرسال إيميل مجانية للبداية) │
 * │   LEAD_TO_EMAIL    = الإيميل الذي تصل إليه الطلبات (افتراضياً إيميل الكلية)        │
 * │   LEAD_FROM_EMAIL  = عنوان المرسل (يجب أن يكون على دومين موثّق في Resend)          │
 * │ بدون هذه المفاتيح: الطلب يُطبع في سجل الخادم (console) فقط — يكفي للمسودة.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export interface LeadState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "phone", string>>;
}

const PHONE_RE = /^(\+?972[-\s]?|0)?(5\d|[2-9])[-\s]?\d{3}[-\s]?\d{4}$/;

const normalizePhone = (raw: string) => raw.replace(/[\s-]/g, "");

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const courseSlug = String(formData.get("course") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const locale = String(formData.get("locale") ?? "ar");
  const source = String(formData.get("source") ?? "");
  const honeypot = String(formData.get("website") ?? "");

  // مصيدة روبوتات: الحقل مخفي، أي إنسان لا يعبّيه
  if (honeypot) return { status: "success" };

  const fieldErrors: LeadState["fieldErrors"] = {};
  if (name.length < 2) fieldErrors.name = locale === "he" ? "נא להזין שם." : "اكتب اسمك من فضلك.";
  if (!PHONE_RE.test(normalizePhone(phone))) fieldErrors.phone = locale === "he" ? "נא להזין מספר טלפון תקין." : "اكتب رقم هاتف صحيح.";
  if (Object.keys(fieldErrors).length) return { status: "error", fieldErrors };

  const course = getCourse(courseSlug);
  const courseName = course ? `${course.name.ar} / ${course.name.he}` : courseSlug === "any" || !courseSlug ? "استشارة عامة" : courseSlug;

  const lines = [
    `طلب جديد من موقع الكلية (${source || "unknown"}) — اللغة: ${locale}`,
    `الاسم: ${name}`,
    `الهاتف: ${phone}`,
    email ? `الإيميل: ${email}` : null,
    company ? `الشركة: ${company}` : null,
    `الدورة: ${courseName}`,
    message ? `ملاحظات: ${message}` : null,
    `التاريخ: ${new Date().toISOString()}`,
  ].filter(Boolean);
  const text = lines.join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL || site.email;
  const from = process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey) {
    console.log("\n=== [LEAD] طلب جديد (لم يُرسل بالإيميل — RESEND_API_KEY غير موجود) ===\n" + text + "\n===\n");
    return { status: "success" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `طلب تسجيل اهتمام: ${name} — ${course ? course.name.ar : "استشارة عامة"}`,
      text,
      replyTo: email || undefined,
    });
    if (error) throw new Error(error.message);
    return { status: "success" };
  } catch (err) {
    console.error("[LEAD] فشل إرسال الإيميل:", err, "\n" + text);
    return { status: "error", message: locale === "he" ? "אירעה שגיאה בשליחה." : "صار خطأ بالإرسال." };
  }
}
