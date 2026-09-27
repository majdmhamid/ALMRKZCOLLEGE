/**
 * وضع التجربة للتوقيع الإلكتروني (بدون Supabase): قاعدة بيانات وملفات وهمية بمجلد .mock-data على الجهاز.
 * بيشتغل إذا MOCK_BACKEND=1، أو لحاله لما Supabase مش مضبوط والموقع شغّال على جهاز
 * (npm run dev، أو start-windows.bat). على Vercel لازم Supabase — ما في وضع تجربة هناك.
 */
export const isMockBackend =
  process.env.MOCK_BACKEND === '1' || (!process.env.VERCEL && !process.env.NEXT_PUBLIC_SUPABASE_URL)
