/**
 * Creates an admin: a Supabase Auth user (email confirmed) + an admin_profiles row.
 * If the user already exists, only the admin profile is added.
 * Usage: npm run admin:create
 */
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { need } from "./load-env.mjs";

const supabase = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rl = createInterface({ input: process.stdin, output: process.stdout });
const email = (await rl.question("البريد الإلكتروني للمدير: ")).trim();
const displayName = (await rl.question("الاسم اللي بيطلع بالنظام: ")).trim();
const password = (await rl.question("كلمة السر (12 حرف على الأقل): ")).trim();
rl.close();

if (!/^\S+@\S+\.\S+$/.test(email)) fail("البريد مش صحيح");
if (password.length < 12) fail("كلمة السر لازم تكون 12 حرف أو أكثر");

let userId;
const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) {
  if (!/already|registered|exists/i.test(created.error.message)) fail(created.error.message);
  // Already exists → find it and just grant admin.
  for (let page = 1; !userId && page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(error.message);
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    if (data.users.length < 200) break;
  }
  if (!userId) fail("المستخدم موجود بس ما لقيته");
  console.log("  المستخدم موجود من قبل — بس رح نعطيه صلاحية مدير (كلمة السر ما تغيّرت)");
} else {
  userId = created.data.user.id;
}

const { error } = await supabase.from("admin_profiles").upsert({ user_id: userId, display_name: displayName });
if (error) fail(error.message);
console.log(`\n✓ المدير جاهز: ${email}\n`);

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}
