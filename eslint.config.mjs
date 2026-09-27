import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // بيانات وضع التجربة، ملفات pdf.js المنسوخة، وصور التوثيق
    ".mock-data/**",
    ".cms-data/**",
    "public/**",
    "docs/**",
  ]),
]);

export default eslintConfig;
