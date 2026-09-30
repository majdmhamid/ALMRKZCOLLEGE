/**
 * فحص المفاتيح (Environment Variables) قبل البناء على Vercel.
 * بيوقّف النشر برسالة واضحة بدل ما الموقع يطلع خربان.
 *
 *   npm run check:env                 ← فحص كامل (مع الاتصال بقاعدة البيانات)
 *   node scripts/check-env.mjs --if-vercel   ← بـ `npm run ci`: بيشتغل بس على Vercel
 *   node scripts/check-env.mjs --offline     ← بدون اتصال بقاعدة البيانات
 *
 * The pure checks live in checkEnv() (tested in tests/check-env.test.ts).
 */
import { fileURLToPath } from "node:url";

const isPostgresURL = (v) => /^postgres(ql)?:\/\/[^/\s]+\/?/.test(v || "");
const placeholder = (v) => /\[YOUR-PASSWORD\]|<[^>]+>|YOUR[-_]PASSWORD/i.test(v || "");
const trimSlash = (v) => (v || "").trim().replace(/\/+$/, "");
const isHttps = (v) => {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * @param {Record<string, string | undefined>} env
 * @param {{ hasAdmin?: boolean | null, devPush?: boolean }} [db] from the database; hasAdmin null/undefined = unknown (no DB check)
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function checkEnv(env, db = {}) {
  const errors = [];
  const warnings = [];
  const val = (k) => (env[k] || "").trim();
  const missing = (k, what) => errors.push(`${k} ناقص — ${what}`);

  // ── قاعدة البيانات ──
  const dbURL = val("DATABASE_URL") || val("POSTGRES_URL");
  if (!dbURL) missing("DATABASE_URL", "انسخ «Transaction pooler» من Supabase ← Connect.");
  else if (!isPostgresURL(dbURL)) errors.push("DATABASE_URL لازم يبلّش بـ postgresql:// (مش file: ولا رابط موقع).");
  else if (placeholder(dbURL)) errors.push("DATABASE_URL فيه [YOUR-PASSWORD] — حط كلمة سر قاعدة البيانات مكانها.");

  for (const k of ["DATABASE_URL", "SUPABASE_DB_URL"]) {
    const v = val(k);
    if (/@db\.[a-z0-9]+\.supabase\.co/.test(v)) {
      errors.push(`${k} هو «Direct connection» — Vercel ما بيقدر يوصله. انسخ «Transaction pooler» من Supabase ← Connect.`);
    } else if (/pooler\.supabase\.com:5432/.test(v)) {
      warnings.push(`${k} هو «Session pooler» (5432) — الأفضل «Transaction pooler» (6543)، وإلا ممكن يطلع «max clients reached» لما يفوت ناس كثير.`);
    }
  }

  if (val("PAYLOAD_DB_PUSH") === "true") {
    errors.push("PAYLOAD_DB_PUSH=true ممنوع على الموقع الحقيقي — احذفه (التغييرات بتصير عن طريق migrations).");
  }

  // ── المفاتيح السرية ──
  const payloadSecret = val("PAYLOAD_SECRET");
  if (!payloadSecret) missing("PAYLOAD_SECRET", "انسخه من ملف .env.local (npm run secrets).");
  else if (payloadSecret.length < 32) errors.push("PAYLOAD_SECRET قصير — لازم 32 حرف على الأقل (npm run secrets).");

  const sessionSecret = val("SESSION_SECRET");
  if (!sessionSecret) missing("SESSION_SECRET", "مفتاح التوقيع — انسخه من ملف .env.local (npm run secrets).");
  else if (sessionSecret.length < 32) errors.push("SESSION_SECRET قصير — لازم 32 حرف على الأقل. انسخه كامل من .env.local.");
  const tokenKey = val("TOKEN_ENC_KEY");
  if (!tokenKey) missing("TOKEN_ENC_KEY", "مفتاح التوقيع — انسخه من ملف .env.local (npm run secrets).");
  else if (!/^[A-Za-z0-9+/]+={0,2}$/.test(tokenKey) || Buffer.from(tokenKey, "base64").length !== 32) {
    errors.push("TOKEN_ENC_KEY مش صحيح (لازم 44 حرف تنتهي بـ =). انسخه كامل من .env.local بدون فراغات.");
  }

  if (!val("CRON_SECRET")) {
    warnings.push("CRON_SECRET ناقص — «النشر المجدول» للأخبار ما رح يشتغل. انسخه من .env.local (npm run secrets).");
  }

  // ── عنوان الموقع ──
  const server = trimSlash(val("NEXT_PUBLIC_SERVER_URL"));
  const app = trimSlash(val("NEXT_PUBLIC_APP_URL"));
  if (!server) missing("NEXT_PUBLIC_SERVER_URL", "عنوان الموقع، مثلاً https://almrkz.vercel.app");
  else if (!isHttps(server)) errors.push("NEXT_PUBLIC_SERVER_URL لازم يبلّش بـ https://");
  if (!app) missing("NEXT_PUBLIC_APP_URL", "نفس عنوان الموقع (روابط التوقيع اللي بتنبعت للعملاء).");
  else if (!isHttps(app)) errors.push("NEXT_PUBLIC_APP_URL لازم يبلّش بـ https://");
  if (server && app && server !== app) {
    errors.push(`NEXT_PUBLIC_SERVER_URL و NEXT_PUBLIC_APP_URL لازم يكونوا نفس العنوان (هلأ: ${server} ≠ ${app}).`);
  }

  // ── تخزين الصور ──
  const s3Keys = ["S3_BUCKET", "S3_REGION", "S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"];
  const s3Set = s3Keys.filter((k) => val(k));
  if (val("BLOB_READ_WRITE_TOKEN")) {
    if (s3Set.length) warnings.push("في BLOB_READ_WRITE_TOKEN وكمان S3_* — الموقع رح يستعمل Vercel Blob بس، وS3 بيتجاهله.");
  } else if (!s3Set.length) {
    errors.push("ما في تخزين للصور: عبّي S3_BUCKET و S3_REGION و S3_ENDPOINT و S3_ACCESS_KEY_ID و S3_SECRET_ACCESS_KEY (من Supabase ← Storage ← S3).");
  } else {
    for (const k of s3Keys) if (!val(k)) missing(k, "كل مفاتيح S3_* لازم يكونوا معبّايين سوا.");
    const endpoint = val("S3_ENDPOINT");
    if (endpoint && !/^https:\/\/.+/.test(endpoint)) errors.push("S3_ENDPOINT لازم يبلّش بـ https://");
    if (/supabase\.co/.test(endpoint) && !/\/storage\/v1\/s3\/?$/.test(endpoint)) {
      errors.push("S3_ENDPOINT تبع Supabase لازم ينتهي بـ /storage/v1/s3");
    }
    if (val("S3_REGION") === "auto" && /supabase\.co/.test(endpoint)) {
      errors.push("S3_REGION لازم يكون منطقة مشروع Supabase (مثلاً eu-central-1)، مش auto.");
    }
  }

  // ── Supabase (التوقيع الإلكتروني) ──
  const supaURL = val("NEXT_PUBLIC_SUPABASE_URL");
  if (!supaURL) missing("NEXT_PUBLIC_SUPABASE_URL", "من Supabase ← Project Settings ← API ← Project URL.");
  else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(supaURL)) {
    warnings.push("NEXT_PUBLIC_SUPABASE_URL عادةً بيكون https://<اسم>.supabase.co — تأكد إنك نسخته صح.");
  }
  const serviceKey = val("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) missing("SUPABASE_SERVICE_ROLE_KEY", "من Supabase ← Project Settings ← API Keys ← service_role / secret.");
  else if (serviceKey.length < 20) errors.push("SUPABASE_SERVICE_ROLE_KEY قصير — انسخه كامل.");
  const signingDB = val("SUPABASE_DB_URL");
  if (!signingDB) missing("SUPABASE_DB_URL", "نفس رابط DATABASE_URL (أو «Transaction pooler»).");
  else if (!isPostgresURL(signingDB)) errors.push("SUPABASE_DB_URL لازم يبلّش بـ postgresql://");
  else if (placeholder(signingDB)) errors.push("SUPABASE_DB_URL فيه [YOUR-PASSWORD] — حط كلمة سر قاعدة البيانات مكانها.");

  if (val("MOCK_BACKEND")) {
    errors.push("MOCK_BACKEND لازم ينحذف من Vercel — هاد بس للتجربة على الجهاز.");
  }

  // ── الإيميل: كلهم أو ولا واحد ──
  const smtpKeys = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"];
  const smtpSet = smtpKeys.filter((k) => val(k));
  if (!smtpSet.length) {
    warnings.push("ما في إيميل (SMTP_*): الطلبات بتنحفظ بلوحة التحكم بس ما بيوصل إيميل، و«نسيت كلمة السر» ما بيشتغل.");
  } else {
    for (const k of smtpKeys) if (!val(k)) missing(k, "مفاتيح الإيميل SMTP_HOST و SMTP_USER و SMTP_PASS لازم يكونوا سوا (البند ٣ بالدليل).");
    const port = val("SMTP_PORT") || "587";
    if (!/^\d+$/.test(port)) errors.push("SMTP_PORT لازم يكون رقم (587).");
    if (!val("EMAIL_FROM_ADDRESS")) missing("EMAIL_FROM_ADDRESS", "العنوان اللي بتطلع منه الإيميلات.");
    if (val("SMTP_HOST") === "smtp.gmail.com") {
      if (/\s/.test(env.SMTP_PASS || "")) errors.push("SMTP_PASS (كلمة سر تطبيق Gmail) لازم تنكتب بدون فراغات.");
      if (val("EMAIL_FROM_ADDRESS") && val("SMTP_USER") && val("EMAIL_FROM_ADDRESS") !== val("SMTP_USER")) {
        warnings.push("مع Gmail: EMAIL_FROM_ADDRESS لازم يكون نفس SMTP_USER، وإلا Gmail بيغيّره لحاله.");
      }
    }
  }

  // ── أول مدير ──
  const seedEmail = val("SEED_ADMIN_EMAIL");
  const seedPass = val("SEED_ADMIN_PASSWORD");
  if (db.hasAdmin === false) {
    if (!seedEmail) missing("SEED_ADMIN_EMAIL", "ما في ولا مدير بقاعدة البيانات — لازم إيميل أول مدير (البند ٢).");
    if (!seedPass) missing("SEED_ADMIN_PASSWORD", "ما في ولا مدير بقاعدة البيانات — لازم كلمة سر أول مدير (البند ٢).");
  } else if (db.hasAdmin == null && (!seedEmail || !seedPass)) {
    warnings.push("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD مش معبّايين — بأول نشر لازم يكونوا موجودين.");
  }
  if (db.devPush) {
    errors.push(
      "قاعدة البيانات فيها علامة «dev» (حدا شغّل الموقع بوضع push عليها) — احكي لكلود. " +
        "(payload_migrations batch = -1: افحص الجداول، وبعدين احذف هاد السطر)",
    );
  }
  if (seedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seedEmail)) errors.push("SEED_ADMIN_EMAIL مش إيميل صحيح.");
  if (seedPass && seedPass.length < 10) errors.push("SEED_ADMIN_PASSWORD قصيرة — 10 أحرف على الأقل.");

  return { errors, warnings };
}

/** Logs in to the SMTP server once (no email is sent). */
async function probeSmtp(env) {
  const { default: nodemailer } = await import("nodemailer");
  const port = Number(env.SMTP_PORT || 587);
  const local = /^(localhost|127.0.0.1)$/.test(env.SMTP_HOST || "");
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465 && !local,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    connectionTimeout: 15000,
  });
  try {
    await transport.verify();
  } finally {
    transport.close();
  }
}

/** Is there at least one user in Payload's `users` table? null = the table doesn't exist yet (first deploy → false). */
async function probeDatabase(url) {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, {
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
    max: 1,
    connect_timeout: 15,
    prepare: false,
    onnotice: () => {},
  });
  try {
    const [{ users, migrations }] = await sql`
      select to_regclass('public.users') as users, to_regclass('public.payload_migrations') as migrations`;
    const hasAdmin = users ? (await sql`select count(*)::int as n from public.users`)[0].n > 0 : false;
    // A "dev" row (batch -1) = someone ran Payload in push mode on this database; `payload migrate`
    // would then stop and wait for an answer that never comes on Vercel.
    const devPush = migrations
      ? (await sql`select count(*)::int as n from public.payload_migrations where batch = -1`)[0].n > 0
      : false;
    return { hasAdmin, devPush };
  } finally {
    await sql.end({ timeout: 2 });
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--if-vercel") && !process.env.VERCEL) return;
  if (!process.env.VERCEL) await import("./load-env.mjs"); // على الجهاز: .env.local / .env

  let db = {};
  const dbURL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const pre = checkEnv(process.env);
  const dbProblem = pre.errors.some((e) => e.startsWith("DATABASE_URL"));
  let dbError = null;
  if (!args.includes("--offline") && dbURL && !dbProblem) {
    try {
      db = await probeDatabase(dbURL);
    } catch (err) {
      dbError = err;
    }
  }
  const { errors, warnings } = checkEnv(process.env, db);
  const smtpComplete = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].every((k) => process.env[k]);
  if (!args.includes("--offline") && smtpComplete) {
    try {
      await probeSmtp(process.env);
    } catch (err) {
      if (err.code === "EAUTH") {
        errors.push(
          "الإيميل: SMTP_USER أو SMTP_PASS غلط (Gmail رفض الدخول). مع Gmail لازم «كلمة سر تطبيق» (16 حرف)، مش كلمة سر الحساب.",
        );
      } else {
        warnings.push(`الإيميل: ما قدرت أتصل بـ ${process.env.SMTP_HOST} (${err.code || err.message}) — تأكد من SMTP_HOST و SMTP_PORT.`);
      }
    }
  }
  if (dbError) {
    errors.unshift(
      `ما قدرت أتصل بقاعدة البيانات (${dbError.code || dbError.message}). تأكد من كلمة السر بـ DATABASE_URL، ` +
        "وإنك نسخت «Transaction pooler» (مش Direct connection — Vercel ما بيقدر يوصلها).",
    );
  }

  console.log("\nفحص المفاتيح (Environment Variables):");
  for (const w of warnings) console.log(`  ⚠️  ${w}`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  if (errors.length) {
    console.log(`\n✗ في ${errors.length} مشكلة — صلّحها بـ Vercel ← Settings ← Environment Variables، وبعدين Redeploy.\n`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ كل المفاتيح تمام${db.hasAdmin === false ? " (أول نشر: رح ينعمل حساب المدير)" : ""}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
