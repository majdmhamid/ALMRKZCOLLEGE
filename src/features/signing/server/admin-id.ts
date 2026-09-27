/**
 * جداول التوقيع بتحفظ هوية المدير كـ UUID. المدراء هم مستخدمو لوحة التحكم (Payload)،
 * فمنشتق UUID ثابت من رقم المستخدم: مستخدم 1 ← a1b2c3d4-0000-4000-8000-000000000001
 */
export const payloadUserUuid = (id: number | string) => {
  const n = String(id).replace(/\D/g, "").slice(-12).padStart(12, "0");
  return `a1b2c3d4-0000-4000-8000-${n}`;
};

/** المدير بالبيانات التجريبية = أول مستخدم باللوحة */
export const MOCK_ADMIN_ID = payloadUserUuid(1);
