/**
 * End-to-end check against the running mock app (npm run dev:mock):
 * admin opens the share dialog → a phone opens the link → wrong ID → right ID →
 * reads → draws a signature → submits → the admin page updates on its own.
 * Saves screenshots to screenshots/. Usage: node scripts/e2e-sign.mjs
 *
 * Uses the seeded document "ייפוי כוח — משפחת אגבאריה" (signer ID 31415926 + check digit).
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

function validId(first8) {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let n = Number(first8[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return first8 + String((10 - (sum % 10)) % 10);
}

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
  await row.getByRole("button", { name: "העתקת קישור לחתימה" }).click();
  const dialog = a.locator("dialog[open]");
  await dialog.locator('[data-testid="share-row"] input').waitFor();
  const link = await dialog.locator('[data-testid="share-row"] input').inputValue();
  step(`link: ${link.slice(0, 40)}…`);
  const wa = await dialog.getByRole("link", { name: "WhatsApp" }).getAttribute("href");
  if (!wa?.startsWith("https://wa.me/972501112233?text=")) throw new Error(`bad WhatsApp link: ${wa}`);
  step("WhatsApp link has the phone and the message");
  await a.screenshot({ path: path.join(out, "admin-share-he.png") });
  await dialog.getByRole("button", { name: "סגירה" }).click();

  // --- Client on a phone ---------------------------------------------------
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: "ar",
  });
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
  await p.screenshot({ path: path.join(out, "sign-verify-phone-ar.png") });
  step("client sees the ID step (Arabic, from the phone's language)");

  await p.fill('input[inputmode="numeric"]', validId("12345678"));
  await p.getByRole("button", { name: "متابعة" }).click();
  await p.locator("form [role=alert]").waitFor();
  const err = await p.locator("form [role=alert]").textContent();
  if (!/[0-9]/.test(err ?? "")) throw new Error(`expected "N attempts left", got: ${err}`);
  step(`wrong ID → "${err?.trim()}"`);
  await p.screenshot({ path: path.join(out, "sign-wrong-id-phone-ar.png") });

  await p.fill('input[inputmode="numeric"]', validId("31415926"));
  await p.getByRole("button", { name: "متابعة" }).click();
  await p.locator('[data-testid="pdf-viewer"] canvas').first().waitFor({ timeout: 60000 }); // first load compiles pdf.js in dev
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(out, "sign-read-phone-ar.png") });
  step("right ID → the PDF is shown");

  await p.locator('[data-testid="read-confirm"]').check();
  await p.locator('[data-testid="esign-consent"]').check();
  const canvas = p.locator('[data-testid="signature-canvas"]');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  // Draw with a mouse path (signature_pad listens to pointer events).
  await p.mouse.move(box.x + 40, box.y + 120);
  await p.mouse.down();
  for (let i = 0; i <= 30; i++) {
    const x = box.x + 40 + i * ((box.width - 80) / 30);
    const y = box.y + 100 + Math.sin(i / 3) * 40;
    await p.mouse.move(x, y, { steps: 2 });
  }
  await p.mouse.up();
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
  console.log("\n✓ end-to-end signing works\n");
} catch (err) {
  await failureHook();
  throw err;
} finally {
  await browser.close();
}
