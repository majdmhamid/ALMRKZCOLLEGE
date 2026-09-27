/**
 * Admin signature + Settings check against the running mock app (npm run dev:mock):
 * blue pen on "ראיה / מוצגים — תיק 4471" → draw + save for next time → the blue
 * badge disappears → Settings shows the saved signature → turn on "type name" →
 * the template preview updates → save.
 * Usage: node scripts/e2e-admin.mjs   (needs fresh mock data: delete .mock-data first)
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { root } from "./load-env.mjs";

const base = process.argv[2] || "http://localhost:3000";
const out = path.join(root, "screenshots");
mkdirSync(out, { recursive: true });
const executablePath = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));
const step = (msg) => console.log(`  • ${msg}`);

const browser = await chromium.launch({ executablePath, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: "he-IL" });
ctx.setDefaultTimeout(120000);
await ctx.addCookies([{ name: "NEXT_LOCALE", value: "he", url: base }, { name: "admin_locale", value: "he", url: base }]);
const page = await ctx.newPage();

async function drawOn(canvas) {
  await canvas.scrollIntoViewIfNeeded();
  const b = await canvas.boundingBox();
  await page.mouse.move(b.x + 30, b.y + b.height * 0.6);
  await page.mouse.down();
  for (let i = 0; i <= 24; i++) await page.mouse.move(b.x + 30 + i * ((b.width - 60) / 24), b.y + b.height * 0.5 + Math.sin(i / 2.5) * 30, { steps: 2 });
  await page.mouse.up();
}

try {
  await page.goto(`${base}/admin/login`);
  await page.fill('input[name="email"]', "admin@example.test");
  await page.fill('input[name="password"]', "mock-password");
  await Promise.all([page.waitForURL(/\/admin(?!\/login)(\/|$)/), page.click('button[type="submit"]')]);
  await page.goto(`${base}/admin/documents`, { waitUntil: "networkidle" });

  const row = page.locator('[data-testid="document-row"]', { hasText: "4471" });
  await row.getByRole("button", { name: "חתימה שלי" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('[data-testid="signature-canvas"]').waitFor();
  await drawOn(dialog.locator('[data-testid="signature-canvas"]'));
  await page.screenshot({ path: path.join(out, "admin-sign-dialog-he.png") });
  await dialog.locator('[data-testid="admin-sign-submit"]').click();
  await page.locator("[aria-live]", { hasText: "חתמת על המסמך" }).waitFor();
  await page.waitForFunction(() => {
    const r = [...document.querySelectorAll('[data-testid="document-row"]')].find((el) => el.textContent.includes("4471"));
    return r && !r.textContent.includes("לחתימתך");
  });
  step("blue pen: signed, blue badge gone");

  await page.goto(`${base}/admin/settings`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="saved-signature"]').waitFor();
  step("settings shows the saved signature");
  await page.getByRole("switch", { name: /הקלדת שם/ }).check({ force: true });
  await page.getByPlaceholder("שלום, מצורף מסמך לחתימה דיגיטלית:").fill("שלום, מצורף מסמך מכללת המרכז לחתימה:");
  await page.locator('[data-testid="save-settings"]').click();
  await page.locator("[aria-live]", { hasText: "ההגדרות נשמרו" }).waitFor();
  await page.screenshot({ path: path.join(out, "admin-settings-he.png"), fullPage: true });
  step("settings saved (type-name on, message template)");

  await page.reload({ waitUntil: "networkidle" });
  if (!(await page.getByRole("switch", { name: /הקלדת שם/ }).isChecked())) throw new Error("setting not persisted");
  step("settings persisted after reload");
  console.log("\n✓ admin signature and settings work\n");
} catch (err) {
  await page.screenshot({ path: path.join(out, "e2e-failure.png") }).catch(() => {});
  throw err;
} finally {
  await browser.close();
}
