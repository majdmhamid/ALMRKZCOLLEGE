/**
 * Takes screenshots of the running mock app (npm run dev:mock) into screenshots/.
 * Uses the locally installed Chrome/Edge through playwright-core — no browser download.
 * Usage: node scripts/screenshots.mjs [baseUrl]
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { root } from "./load-env.mjs";

const base = process.argv[2] || "http://localhost:3000";
const outDir = path.join(root, "screenshots");
mkdirSync(outDir, { recursive: true });

const candidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) throw new Error("No Chrome/Edge found — set CHROME_PATH");

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

/** Each shot: name, path, viewport, locale, needs admin login, optional page actions. */
const shots = [
  { name: "login-he", url: "/admin/login", viewport: DESKTOP, locale: "he" },
  { name: "admin-documents-he", url: "/admin/documents", viewport: DESKTOP, locale: "he", admin: true },
  { name: "admin-documents-ar", url: "/admin/documents", viewport: DESKTOP, locale: "ar", admin: true },
  {
    name: "admin-documents-phone-he",
    url: "/admin/documents",
    viewport: PHONE,
    locale: "he",
    admin: true,
    phone: true,
    fullPage: true,
  },
  {
    name: "admin-new-document-he",
    url: "/admin/documents",
    viewport: DESKTOP,
    locale: "he",
    admin: true,
    viewportOnly: true,
    run: async (page) => {
      await page.getByRole("button", { name: "העלאת מסמך" }).click();
      await page.locator("dialog[open]").waitFor();
      await page.getByPlaceholder("שם מלא").fill("ליאן מחאמיד");
      await page.getByPlaceholder("ת.ז").fill("123456782");
      await page.getByPlaceholder("טלפון (לא חובה)").fill("052-555-1234");
    },
  },
  {
    name: "admin-select-mode-he",
    url: "/admin/documents",
    viewport: DESKTOP,
    locale: "he",
    admin: true,
    viewportOnly: true,
    run: async (page) => {
      await page.getByRole("button", { name: "בחר", exact: true }).click();
      const boxes = page.locator('[data-testid="document-row"] input[type="checkbox"]');
      await boxes.nth(0).check();
      await boxes.nth(2).check();
      await page.locator('[data-testid="month-group"]').first().scrollIntoViewIfNeeded();
    },
  },
  {
    name: "admin-bell-he",
    url: "/admin/documents",
    viewport: DESKTOP,
    locale: "he",
    admin: true,
    viewportOnly: true,
    run: async (page) => {
      await page.getByRole("button", { name: /התראות/ }).click();
    },
  },
  { name: "admin-settings-he", url: "/admin/settings", viewport: DESKTOP, locale: "he", admin: true },
  { name: "admin-signed-he", url: "/admin/signed", viewport: DESKTOP, locale: "he", admin: true },
  { name: "sign-phone-ar", url: "/sign/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ", viewport: PHONE, locale: "ar", phone: true },
  { name: "sign-phone-he", url: "/sign/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ", viewport: PHONE, locale: "he", phone: true },
];

const only = process.env.SHOTS?.split(",");
const browser = await chromium.launch({ executablePath, headless: true });

try {
  for (const shot of shots) {
    if (only && !only.includes(shot.name)) continue;
    const context = await browser.newContext({
      viewport: shot.viewport,
      deviceScaleFactor: shot.phone ? 3 : 1,
      isMobile: !!shot.phone,
      hasTouch: !!shot.phone,
      locale: shot.locale === "ar" ? "ar" : "he-IL",
    });
    context.setDefaultTimeout(120000); // dev server compiles pages on first visit
    await context.addCookies([{ name: "NEXT_LOCALE", value: shot.locale, url: base }, { name: "admin_locale", value: shot.locale, url: base }]);
    const page = await context.newPage();

    if (shot.admin) {
      await page.goto(`${base}/admin/login`);
      await page.fill('input[name="email"]', process.env.MOCK_ADMIN_EMAIL || "admin@example.test");
      await page.fill('input[name="password"]', process.env.MOCK_ADMIN_PASSWORD || "mock-password");
      await Promise.all([page.waitForURL(/\/admin(?!\/login)(\/|$)/), page.click('button[type="submit"]')]);
    }

    await page.goto(`${base}${shot.url}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    if (shot.run) await shot.run(page);
    // Hide the Next.js dev indicator so it doesn't cover content.
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    const file = path.join(outDir, `${shot.name}.png`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: file, fullPage: shot.fullPage ?? (!shot.phone && !shot.viewportOnly) });
    console.log(`  ✓ ${path.relative(root, file)}`);
    await context.close();
  }
} finally {
  await browser.close();
}
