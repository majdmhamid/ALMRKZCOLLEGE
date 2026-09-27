/**
 * لوحة التحكم بتعرض نفس بطاقات الموقع (خريجون، طاقم، دورات، أخبار...).
 * أنماط الموقع (src/components/site/site.css) عامة (body, a, h1...) وبتخرّب شكل اللوحة لو انضافت كما هي،
 * فهاد السكربت بيعمل نسخة منها محصورة داخل .site-scope → src/admin/site-scoped.css
 *
 * بيشتغل لحاله مع predev و prebuild. بعد أي تعديل على site.css: npm run generate:admin-css
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'src/components/site/site.css')
const out = path.join(root, 'src/admin/site-scoped.css')
const SCOPE = '.site-scope'

const scopeSelector = (sel) => {
  const s = sel.trim()
  if (!s) return s
  // html / body / :root → الحاوية نفسها
  if (/^(html|body|:root)$/.test(s)) return SCOPE
  if (/^(html|body|:root)[\s>+~.[:#]/.test(s)) return s.replace(/^(html|body|:root)/, SCOPE)
  // html.js .x أو html[dir] .x → نشيل html ونحصر
  return `${SCOPE} ${s}`
}

const css = readFileSync(src, 'utf8')
const result = postcss([
  {
    postcssPlugin: 'scope',
    Rule(rule) {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return
      if (rule.selector.includes(SCOPE)) return
      rule.selectors = rule.selectors.map(scopeSelector)
    },
    AtRule: {
      // الخطوط موجودة أصلاً بأنماط اللوحة
      'font-face': (at) => at.remove(),
    },
  },
]).process(css, { from: src }).css

writeFileSync(out, `/* مولَّد تلقائياً من src/components/site/site.css — لا تعدّله يدوياً (scripts/scope-site-css.mjs) */\n${result}`)
console.log(`✓ ${path.relative(root, out)}`)
