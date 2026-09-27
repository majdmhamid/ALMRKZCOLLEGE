/**
 * Finalize + Signed section check against the running mock app (npm run dev:mock):
 * place both signatures on "הסכם שכר טרחה" → finalize → the final PDF downloads →
 * unlock → finalize again → green arrows move it to "נחתמו" → move it back.
 * Usage: node scripts/e2e-finalize.mjs   (needs fresh mock data: delete .mock-data first)
 */
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
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
const TITLE = "הסכם שכר טרחה";

const browser = await chromium.launch({ executablePath, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: "he-IL", acceptDownloads: true });
ctx.setDefaultTimeout(120000);
await ctx.addCookies([{ name: "NEXT_LOCALE", value: "he", url: base }, { name: "admin_locale", value: "he", url: base }]);
const page = await ctx.newPage();

async function dragCardTo(cardIndex, pageNumber, fx, fy) {
  const card = page.locator('[data-testid="signature-card"]').nth(cardIndex).locator("img").first();
  const cb = await card.boundingBox();
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
const toast = (text) => page.locator("[aria-live]", { hasText: text }).waitFor();
const finalizeBtn = () => page.locator('[data-testid="finalize"]');
async function confirmFinalize() {
  await finalizeBtn().click();
  await page.locator("dialog[open]").getByRole("button", { name: /סיום והפקת PDF סופי/ }).click();
  await toast("ה-PDF הסופי מוכן");
  await page.getByRole("button", { name: "פתיחה לעריכה מחדש" }).waitFor();
}

try {
  await page.goto(`${base}/admin/login`);
  await page.fill('input[name="email"]', "admin@example.test");
  await page.fill('input[name="password"]', "mock-password");
  await Promise.all([page.waitForURL(/\/admin(?!\/login)(\/|$)/), page.click('button[type="submit"]')]);
  await page.goto(`${base}/admin/documents`, { waitUntil: "networkidle" });

  await page.locator('[data-testid="document-row"]', { hasText: TITLE }).locator("button").first().click();
  await page.waitForURL(/\/admin\/documents\/[0-9a-f-]{36}$/);
  await page.locator('[data-page="1"] canvas').waitFor();
  if (!(await finalizeBtn().isDisabled())) throw new Error("finalize should wait for placements");
  step("finalize disabled until something is placed");

  await dragCardTo(0, 1, 0.3, 0.86);
  await dragCardTo(1, 1, 0.72, 0.86);
  await page.locator('[data-testid="save-state"]', { hasText: "נשמר" }).waitFor();
  await page.waitForFunction(() => !document.querySelector('[data-testid="finalize"]')?.hasAttribute("disabled"));
  step("both signatures placed and saved → finalize enabled");

  await confirmFinalize();
  await page.screenshot({ path: path.join(out, "finalized-he.png") });
  step("finalized: badge + read-only editor");
  if (!(await page.getByText("המסמך סופי — אי אפשר לשנות מיקומים").count())) throw new Error("editor should be read-only");

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "הורדת PDF סופי" }).click()]);
  const file = path.join(tmpdir(), "final-sample.pdf");
  await download.saveAs(file);
  step(`final PDF downloaded: ${download.suggestedFilename()}`);

  await page.getByRole("button", { name: "פתיחה לעריכה מחדש" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "פתיחה לעריכה מחדש" }).click();
  await toast("המסמך נפתח לעריכה");
  await finalizeBtn().waitFor();
  step("unlocked → editor editable again");
  await confirmFinalize();
  step("finalized again");

  await page.getByRole("tab", { name: "היסטוריה" }).click();
  const history = await page.locator('[data-testid="history"] li').allTextContents();
  step(`history mentions finalize/unlock: ${history.filter((h) => /סופי|נפתח/.test(h)).length} events`);

  // Green arrows → Signed section, then back.
  await page.goto(`${base}/admin/documents`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="document-row"]', { hasText: TITLE }).getByRole("button", { name: "העברה לנחתמו" }).click();
  await toast("המסמך הועבר לנחתמו");
  await page.goto(`${base}/admin/signed`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="document-row"]', { hasText: TITLE }).waitFor();
  await page.screenshot({ path: path.join(out, "signed-section-he.png"), fullPage: true });
  step("moved to נחתמו");
  await page.locator('[data-testid="document-row"]', { hasText: TITLE }).getByRole("button", { name: "החזרה למסמכים" }).click();
  await toast("המסמך הוחזר למסמכים");
  step("moved back");
  console.log("\n✓ finalize and Signed section work\n");
} catch (err) {
  await page.screenshot({ path: path.join(out, "e2e-failure.png") }).catch(() => {});
  throw err;
} finally {
  await browser.close();
}
