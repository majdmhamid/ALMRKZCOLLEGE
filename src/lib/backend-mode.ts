/**
 * وضع التجربة (بدون Supabase): بيانات وهمية على الجهاز — للتطوير والصور فقط.
 * يشتغل إذا MOCK_BACKEND=1، أو تلقائياً على جهاز التطوير لما Supabase مش مضبوط.
 * على الموقع الحقيقي (production) لازم Supabase.
 *
 * بدون "server-only" حتى يقدر proxy.ts يستعمله كمان.
 */
export const isMockBackend =
  process.env.MOCK_BACKEND === "1" || (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV !== "production");
