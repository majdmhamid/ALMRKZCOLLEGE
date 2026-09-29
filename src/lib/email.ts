/**
 * Is sending email set up (SMTP_HOST)? Without it, on the real site nothing is ever sent
 * («نسيت كلمة السر» links, new-lead notifications). Locally (npm run dev) Payload prints the
 * email to the server log instead, which is enough for trying things out.
 */
export const emailIsSetUp = () => Boolean(process.env.SMTP_HOST) || process.env.NODE_ENV !== 'production'

export const NO_EMAIL_MESSAGE = {
  ar: 'إرسال الإيميلات لسا مش مفعّل بالموقع، فما بنقدر نبعتلك رابط لتغيير كلمة السر. اطلب من مدير اللوحة يغيّرها إلك من «المستخدمون».',
  he: 'שליחת מיילים עדיין לא מופעלת באתר, ולכן אי אפשר לשלוח קישור לאיפוס הסיסמה. בקשו ממנהל הלוח לשנות אותה עבורכם ב«משתמשים».',
}
