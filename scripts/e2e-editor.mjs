/**
 * Placement editor check against the running mock app (npm run dev:mock):
 * open a signed document → drag a signature onto page 1 → autosave → resize →
 * reload (positions persist) → drag a second copy onto page 3 (landscape) →
 * delete one → history tab. Screenshots go to screenshots/.
 * Usage: node scripts/e2e-editor.mjs
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

async function placements() {
  return page.locator(".placement-box").count();
}
async function waitSaved() {
  await page.locator('[data-testid="save-state"]', { hasText: "נשמר" }).waitFor({ timeout: 20000 });
}
async function dragCardTo(signerIndex, pageNumber, fx, fy) {
  const card = page.locator('[data-testid="signature-card"]').nth(signerIndex).locator("img").first();
  const cb = await card.boundingBox();
  // Scroll the editor so the drop point is on screen.
  await page.evaluate(
    ([n, y]) => {
      const el = document.querySelector(`[data-page="${n}"]`);
      const scroller = document.querySelector('[data-testid="editor-pages"]');
      const r = el.getBoundingClientRect();
      const s = scroller.getBoundingClientRect();
      scroller.scrollTop += r.top + r.height * y - (s.top + s.height / 2);
    },
    [pageNumber, fy],
  );
  await page.waitForTimeout(300);
  const tb = await page.locator(`[data-page="${pageNumber}"]`).boundingBox();
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
  await page.mouse.down();
  await page.mouse.move(tb.x + tb.width * fx, tb.y + tb.height * fy, { steps: 12 });
  await page.mouse.up();
}

try {
  await page.goto(`${base}/admin/login`);
  await page.fill('input[name="email"]', process.env.E2E_ADMIN_EMAIL || "admin@almrkz.local");
  await page.fill('input[name="password"]', process.env.E2E_ADMIN_PASSWORD || "almrkz2008");
  await Promise.all([page.waitForURL(/\/admin(?!\/login)(\/|$)/), page.click('button[type="submit"]')]);
  await page.goto(`${base}/admin/documents`, { waitUntil: "networkidle" });

  // Row click opens the document page.
  await page.locator('[data-testid="document-row"]', { hasText: "חוזה שכירות" }).locator("button").first().click();
  await page.waitForURL(/\/admin\/documents\/[0-9a-f-]{36}$/);
  await page.locator('[data-page="1"] canvas').waitFor();
  await page.waitForTimeout(1500);
  step("document page opened, PDF rendered");

  // Start clean (earlier runs leave placements): select each and press Delete.
  while ((await placements()) > 0) {
    const b = await page.locator(".placement-box").first();
    await b.scrollIntoViewIfNeeded();
    const bb = await b.boundingBox();
    await page.mouse.click(bb.x + bb.width * 0.4, bb.y + bb.height * 0.5);
    await page.keyboard.press("Delete");
    await page.waitForTimeout(200);
  }
  if ((await page.locator('[data-testid="save-state"]').textContent())?.trim()) await waitSaved();

  const warning = await page.locator('[data-testid="not-placed-warning"]').textContent();
  step(`warning shown: "${warning?.trim()}"`);
  await page.screenshot({ path: path.join(out, "editor-empty-he.png") });

  await dragCardTo(0, 1, 0.3, 0.85);
  if ((await placements()) !== 1) throw new Error("drop did not create a placement");
  await waitSaved();
  step("dragged onto page 1 → saved");
  if (await page.locator('[data-testid="not-placed-warning"]').count()) throw new Error("warning should be gone");

  // Resize from the bottom-right corner handle.
  const box = await page.locator(".placement-box").first().boundingBox();
  await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 80, box.y + box.height + 30, { steps: 8 });
  await page.mouse.up();
  const resized = await page.locator(".placement-box").first().boundingBox();
  if (resized.width < box.width + 40) throw new Error(`resize failed: ${box.width} → ${resized.width}`);
  await waitSaved();
  step(`resized ${Math.round(box.width)}px → ${Math.round(resized.width)}px → saved`);

  // Same signature again, on the landscape page.
  await dragCardTo(0, 3, 0.7, 0.8);
  await waitSaved();
  if ((await placements()) !== 2) throw new Error("second copy missing");
  step("second copy dropped on page 3 (landscape)");
  await page.locator('[data-page="1"]').scrollIntoViewIfNeeded();
  await page.locator(".placement-box").first().click();
  await page.screenshot({ path: path.join(out, "editor-placed-he.png") });

  // Reload: both placements come back at the same spot (fractions, not pixels).
  const before = await page.locator(".placement-box").first().boundingBox();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-page="1"] canvas').waitFor();
  await page.waitForTimeout(1000);
  if ((await placements()) !== 2) throw new Error("placements not persisted");
  const after = await page.locator(".placement-box").first().boundingBox();
  if (Math.abs(after.width - before.width) > 2 || Math.abs(after.x - before.x) > 2) {
    throw new Error(`position drifted: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  }
  step("reload → both placements persisted at the same place");

  // Zoom changes pixels but not the relative position.
  await page.getByRole("button", { name: "הגדלה" }).click();
  await page.waitForTimeout(800);
  const zoomed = await page.locator(".placement-box").first().boundingBox();
  const pageBox = await page.locator('[data-page="1"]').boundingBox();
  step(`zoomed: width ${Math.round(after.width)} → ${Math.round(zoomed.width)}px, x fraction ${((zoomed.x - pageBox.x) / pageBox.width).toFixed(3)}`);
  await page.getByRole("button", { name: "התאמה לרוחב" }).click();

  // Delete with the × button (click inside, away from the corner handles).
  await page.locator(".placement-box").first().scrollIntoViewIfNeeded();
  const first = await page.locator(".placement-box").first().boundingBox();
  await page.mouse.click(first.x + first.width * 0.4, first.y + first.height * 0.5);
  await page.getByRole("button", { name: "הסרת החתימה" }).click();
  await waitSaved();
  if ((await placements()) !== 1) throw new Error("delete failed");
  step("deleted one copy → saved");

  await page.getByRole("tab", { name: "היסטוריה" }).click();
  await page.locator('[data-testid="history"]').waitFor();
  await page.screenshot({ path: path.join(out, "editor-history-he.png") });
  step(`history: ${await page.locator('[data-testid="history"] li').count()} events`);
  console.log("\n✓ placement editor works\n");
} catch (err) {
  await page.screenshot({ path: path.join(out, "e2e-failure.png") }).catch(() => {});
  throw err;
} finally {
  await browser.close();
}
