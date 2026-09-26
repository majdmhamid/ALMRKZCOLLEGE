/**
 * Writes docs/CONTENT-MODEL.md from the real Payload config, so the document
 * always matches the database. Run: npm run generate:content-model
 */
import fs from 'fs'
import path from 'path'
import type { Block, Field, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import configPromise from '../src/payload.config'

type Row = { path: string; type: string; flags: string; label: string; notes: string }

const INTERNAL = new Set(['id', 'createdAt', 'updatedAt'])

const labelOf = (l: unknown): string => {
  if (typeof l === 'string') return l
  if (l && typeof l === 'object')
    return (l as Record<string, string>).ar ?? Object.values(l)[0] ?? ''
  return ''
}

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')

const blocksSeen = new Map<string, Block>()

function walk(fields: Field[], prefix: string, rows: Row[]) {
  for (const field of fields) {
    if (field.type === 'ui') continue
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabPrefix = 'name' in tab && tab.name ? `${prefix}${tab.name}.` : prefix
        if ('name' in tab && tab.name) {
          rows.push({
            path: `${prefix}${tab.name}`,
            type: 'group (tab)',
            flags: '',
            label: labelOf(tab.label),
            notes: '',
          })
        }
        walk(tab.fields, tabPrefix, rows)
      }
      continue
    }
    if (field.type === 'row' || field.type === 'collapsible') {
      walk(field.fields, prefix, rows)
      continue
    }
    if (!('name' in field) || INTERNAL.has(field.name)) continue
    const p = `${prefix}${field.name}`
    const flags = [
      'required' in field && field.required ? 'required' : '',
      'localized' in field && field.localized ? '🌐 ar/he' : '',
      'hasMany' in field && field.hasMany ? 'many' : '',
    ]
      .filter(Boolean)
      .join(', ')
    const notes: string[] = []
    if ('relationTo' in field && field.relationTo) {
      notes.push(
        `→ \`${Array.isArray(field.relationTo) ? field.relationTo.join(' / ') : field.relationTo}\``,
      )
    }
    if (field.type === 'join') notes.push(`reverse of \`${field.collection}.${field.on}\``)
    if (field.name === '_status') {
      notes.push('`draft` · `published` (drafts are hidden from the public API)')
    } else if ((field.type === 'select' || field.type === 'radio') && field.options) {
      notes.push(
        field.options
          .map((o) => (typeof o === 'string' ? `\`${o}\`` : `\`${o.value}\``))
          .join(' · '),
      )
    }
    if (
      field.name !== '_status' &&
      'defaultValue' in field &&
      field.defaultValue !== undefined &&
      typeof field.defaultValue !== 'function'
    ) {
      notes.push(`default: \`${JSON.stringify(field.defaultValue)}\``)
    }
    rows.push({
      path: p,
      type: field.type,
      flags,
      label: labelOf('label' in field ? field.label : ''),
      notes: notes.join(' '),
    })
    if (field.type === 'group') walk(field.fields, `${p}.`, rows)
    if (field.type === 'array') walk(field.fields, `${p}[].`, rows)
    if (field.type === 'blocks') {
      for (const b of field.blocks) blocksSeen.set(b.slug, b)
      rows[rows.length - 1].notes =
        `blocks: ${field.blocks.map((b) => `\`${b.slug}\``).join(' · ')}`
    }
  }
}

function table(fields: Field[]): string {
  const rows: Row[] = []
  walk(fields, '', rows)
  return [
    '| Field | Type | Flags | Label (admin) | Notes |',
    '|---|---|---|---|---|',
    ...rows.map(
      (r) => `| \`${r.path}\` | ${r.type} | ${r.flags} | ${esc(r.label)} | ${esc(r.notes)} |`,
    ),
  ].join('\n')
}

function section(
  kind: 'collection' | 'global',
  c: SanitizedCollectionConfig | SanitizedGlobalConfig,
): string {
  const label =
    'labels' in c ? labelOf(c.labels?.plural) : labelOf((c as SanitizedGlobalConfig).label)
  const drafts = c.versions && typeof c.versions === 'object' && c.versions.drafts ? 'yes' : 'no'
  const api = kind === 'collection' ? `/api/${c.slug}` : `/api/globals/${c.slug}`
  const local =
    kind === 'collection'
      ? `payload.find({ collection: '${c.slug}', locale })`
      : `payload.findGlobal({ slug: '${c.slug}', locale })`
  return [
    `### \`${c.slug}\` — ${label}`,
    '',
    `Drafts: **${drafts}** · REST: \`${api}\` · Local API: \`${local}\``,
    '',
    table(c.fields),
    '',
  ].join('\n')
}

const run = async () => {
  const config = await configPromise
  const collections = config.collections.filter((c) => !c.slug.startsWith('payload-'))
  const globals = config.globals

  const out: string[] = []
  out.push(fs.readFileSync(path.resolve('scripts/content-model.intro.md'), 'utf8').trim(), '')
  out.push('## Collections', '')
  for (const c of collections) out.push(section('collection', c))
  out.push('## Globals', '')
  for (const g of globals) out.push(section('global', g))
  if (blocksSeen.size) {
    out.push('## Blocks', '')
    for (const b of blocksSeen.values()) {
      out.push(`### block \`${b.slug}\` — ${labelOf(b.labels?.singular)}`, '', table(b.fields), '')
    }
  }
  const target = path.resolve('docs/CONTENT-MODEL.md')
  fs.writeFileSync(target, out.join('\n'))
  console.log(`Wrote ${target}`)
  process.exit(0)
}

await run()
