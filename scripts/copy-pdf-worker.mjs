/**
 * Copies pdf.js runtime files into public/pdfjs/ so the browser loads them from
 * our own origin, matching the installed pdfjs-dist version:
 *   - the worker
 *   - standard_fonts/ (PDFs that use Helvetica/Times without embedding them)
 *   - cmaps/ (PDFs with CID fonts / non-Latin encodings)
 * Runs on install/dev/build.
 */
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { root } from "./load-env.mjs";

const require = createRequire(import.meta.url);
const pkg = path.dirname(require.resolve("pdfjs-dist/package.json"));
const dest = path.join(root, "public", "pdfjs");

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(path.join(pkg, "build", "pdf.worker.min.mjs"), path.join(dest, "pdf.worker.min.mjs"));
cpSync(path.join(pkg, "standard_fonts"), path.join(dest, "standard_fonts"), { recursive: true });
cpSync(path.join(pkg, "cmaps"), path.join(dest, "cmaps"), { recursive: true });
// Older location, from before the fonts were added.
rmSync(path.join(root, "public", "pdf.worker.min.mjs"), { force: true });
