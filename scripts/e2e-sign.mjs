/**
 * End-to-end check against the running mock app (npm run dev:mock):
 * 1. Personal link: admin opens the share dialog → a phone opens the link → the
 *    PDF is shown straight away (no ID number) → reads → draws → submits → the
 *    admin page updates on its own; reopening the link says "already signed".
 * 2. Shared link (Hebrew phone): full name only (a junk name is refused) → reads →
 *    signs → "someone else wants to sign from this phone" asks for a name again.
 * Saves screenshots to screenshots/. Usage: node scripts/e2e-sign.mjs
 *
 * Uses the seeded documents "ייפוי כוח — משפחת אגבאריה" and "טופס הרשמה — קורס ריתוך".
 * Re-running needs fresh mock data: delete .mock-data first.
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

/** Draws a wavy line on the signature pad (signature_pad listens to pointer events). */
async function draw(p) {
  const canvas = p.locator('[data-testid="signature-canvas"]');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await p.mouse.move(box.x + 40, box.y + 120);
  await p.mouse.down();
  for (let i = 0; i <= 30; i++) {
    const x = box.x + 40 + i * ((box.width - 80) / 30);
    const y = box.y + 100 + Math.sin(i / 3) * 40;
    await p.mouse.move(x, y, { steps: 2 });
  }
  await p.mouse.up();
}

/** The admin's share dialog for a document row → the first link in it. */
async function linkFor(a, rowText) {
  const row = a.locator('[data-testid="document-row"]', { hasText: rowText });
  await row.getByRole("button", { name: "העתקת קישור לחתימה" }).click();
  const dialog = a.locator("dialog[open]");
  await dialog.locator('[data-testid="share-row"] input').waitFor();
  const link = await dialog.locator('[data-testid="share-row"] input').inputValue();
  return { dialog, link };
}

const phoneContext = (locale) =>
  browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale });

const step = (msg) => console.log(`  • ${msg}`);
const browser = await chromium.launch({ executablePath, headless: true });
let failureHook = async () => {};

try {
  // --- Admin ---------------------------------------------------------------
  const admin = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "he-IL" });
  await admin.addCookies([{ name: "NEXT_LOCALE", value: "he", url: base }, { name: "admin_locale", value: "he", url: base }]);
  admin.setDefaultTimeout(120000);
  const a = await admin.newPage();
  await a.goto(`${base}/admin/login`);
  await a.fill('input[name="email"]', process.env.E2E_ADMIN_EMAIL || "admin@almrkz.local");
  await a.fill('input[name="password"]', process.env.E2E_ADMIN_PASSWORD || "almrkz2008");
  await Promise.all([a.waitForURL(/\/admin(?!\/login)(\/|$)/), a.click('button[type="submit"]')]);
  await a.goto(`${base}/admin/documents`, { waitUntil: "networkidle" });

  const row = a.locator('[data-testid="document-row"]', { hasText: "משפחת אגבאריה" });
  const bellBefore = Number((await a.locator('[data-testid="bell-count"]').textContent().catch(() => "0")) || 0);
  step(`bell before: ${bellBefore}`);
  const { dialog, link } = await linkFor(a, "משפחת אגבאריה");
  step(`link: ${link.slice(0, 40)}…`);
  const wa = await dialog.getByRole("link", { name: "WhatsApp" }).getAttribute("href");
  if (!wa?.startsWith("https://wa.me/972501112233?text=")) throw new Error(`bad WhatsApp link: ${wa}`);
  step("WhatsApp link has the phone and the message");
  await a.screenshot({ path: path.join(out, "admin-share-he.png") });
  await dialog.getByRole("button", { name: "סגירה" }).click();

  // --- Client on a phone ---------------------------------------------------
  const phone = await phoneContext("ar");
  phone.setDefaultTimeout(120000);
  const p = await phone.newPage();
  const consoleErrors = [];
  p.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  p.on("pageerror", (e) => consoleErrors.push(String(e)));
  failureHook = async () => {
    await p.screenshot({ path: path.join(out, "e2e-failure.png") }).catch(() => {});
    console.error("phone console errors:", consoleErrors.slice(0, 10));
  };
  await p.goto(link, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  if (await p.locator('input[inputmode="numeric"]').count()) throw new Error("the signer was asked for a number");
  await p.locator('[data-testid="pdf-viewer"] canvas').first().waitFor({ timeout: 60000 }); // first load compiles pdf.js in dev
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(out, "sign-read-phone-ar.png") });
  step("personal link → the PDF is shown straight away (Arabic, from the phone's language)");

  await p.locator('[data-testid="read-confirm"]').check();
  await p.locator('[data-testid="esign-consent"]').check();
  await draw(p);
  await p.screenshot({ path: path.join(out, "sign-draw-phone-ar.png") });
  step("signature drawn");

  await p.locator('[data-testid="submit-signature"]').click();
  await p.locator('[data-testid="sign-message"]').waitFor({ timeout: 15000 });
  await p.screenshot({ path: path.join(out, "sign-done-phone-ar.png") });
  step("submitted → thank-you screen");

  await p.reload({ waitUntil: "networkidle" });
  const again = await p.locator('[data-testid="sign-message"] h1').textContent();
  step(`reopened link → "${again?.trim()}"`);

  // --- Admin sees it live (no reload) --------------------------------------
  await a.waitForFunction(
    (before) => Number(document.querySelector('[data-testid="bell-count"]')?.textContent || 0) > before,
    bellBefore,
    { timeout: 15000 },
  );
  const status = await row.getAttribute("data-status");
  const progress = await row.locator('[data-testid="progress"]').textContent();
  step(`admin updated live: bell ${await a.locator('[data-testid="bell-count"]').textContent()}, row status ${status}, "${progress}"`);
  await a.screenshot({ path: path.join(out, "admin-live-update-he.png") });

  // --- Shared link: full name only (Hebrew phone) ---------------------------
  await a.keyboard.press("Escape");
  const shared = await linkFor(a, "קורס ריתוך");
  const sharedRow = a.locator('[data-testid="document-row"]', { hasText: "קורס ריתוך" });
  const sharedBefore = (await sharedRow.locator('[data-testid="progress"]').textContent())?.trim();
  await shared.dialog.getByRole("button", { name: "סגירה" }).click();
  const heCtx = await phoneContext("he");
  heCtx.setDefaultTimeout(120000);
  const h = await heCtx.newPage();
  failureHook = async () => {
    await h.screenshot({ path: path.join(out, "e2e-failure.png") }).catch(() => {});
  };
  await h.goto(shared.link, { waitUntil: "networkidle" });
  await h.evaluate(() => document.fonts.ready);
  if (await h.locator('input[inputmode="numeric"]').count()) throw new Error("the shared link asked for a number");
  await h.screenshot({ path: path.join(out, "sign-name-phone-he.png") });
  step("shared link → asks only for the full name (Hebrew)");

  await h.fill('input[autocomplete="name"]', "12345");
  await h.getByRole("button", { name: "המשך" }).click();
  const nameErr = await h.locator("form [role=alert]").textContent();
  step(`junk name → "${nameErr?.trim()}"`);

  await h.fill('input[autocomplete="name"]', "  רנא   חסן ");
  await h.getByRole("button", { name: "המשך" }).click();
  await h.locator('[data-testid="pdf-viewer"] canvas').first().waitFor({ timeout: 60000 });
  const hello = await h.getByText("שלום רנא חסן").count();
  if (!hello) throw new Error("the typed name is not greeted on the sign step");
  step("name accepted → the PDF is shown, greeted by name");
  await h.locator('[data-testid="read-confirm"]').check();
  await h.locator('[data-testid="esign-consent"]').check();
  await draw(h);
  await h.locator('[data-testid="submit-signature"]').click();
  await h.locator('[data-testid="sign-message"]').waitFor({ timeout: 15000 });
  await h.screenshot({ path: path.join(out, "sign-done-phone-he.png") });
  step("shared signature submitted");

  await h.reload({ waitUntil: "networkidle" });
  await h.getByRole("button", { name: "אדם אחר רוצה לחתום מהטלפון הזה" }).click();
  await h.locator('input[autocomplete="name"]').waitFor();
  step("same phone, someone else → asked for a name again");

  await a.waitForFunction(
    ([text, before]) => {
      const r = [...document.querySelectorAll('[data-testid="document-row"]')].find((el) => el.textContent.includes(text));
      return r && r.querySelector('[data-testid="progress"]')?.textContent.trim() !== before;
    },
    ["קורס ריתוך", sharedBefore],
    { timeout: 15000 },
  );
  step(`admin shared row: "${sharedBefore}" → "${(await sharedRow.locator('[data-testid="progress"]').textContent())?.trim()}"`);
  console.log("\n✓ end-to-end signing works\n");
} catch (err) {
  await failureHook();
  throw err;
} finally {
  await browser.close();
}
