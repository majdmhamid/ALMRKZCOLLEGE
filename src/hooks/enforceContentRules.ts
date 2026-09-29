import type {
  CollectionBeforeValidateHook,
  Field,
  GlobalBeforeValidateHook,
  PayloadRequest,
} from 'payload'
import { ValidationError } from 'payload'

import { findForbiddenWording, forbiddenWordingMessage } from '@/lib/rules'

// Technical values that are never shown as sentences on the site.
const SKIPPED_KEYS = new Set([
  'id',
  'slug',
  'url',
  'href',
  'filename',
  'mimeType',
  'thumbnailURL',
  'email',
  'phone',
  'number',
  'password',
  'blockType',
  'format',
  'type',
  'version',
  'direction',
  'mode',
  'style',
])

type Problem = { path: string; message: string; label?: string }

function scan(value: unknown, path: string[], problems: Problem[]) {
  if (typeof value === 'string') {
    const rule = findForbiddenWording(value)
    if (rule) {
      const match = value.match(rule.pattern)?.[0] ?? value
      // Rich text keeps its words deep inside `root.children...`: point at the
      // rich text field itself so the admin highlights something visible.
      const rootIndex = path.indexOf('root')
      const fieldPath = rootIndex > 0 ? path.slice(0, rootIndex) : path
      problems.push({ path: fieldPath.join('.'), message: forbiddenWordingMessage(rule, match) })
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => scan(item, [...path, String(i)], problems))
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (SKIPPED_KEYS.has(key) || key.startsWith('_')) continue
      scan(child, [...path, key], problems)
    }
  }
}

/** Fields at this level, looking through unnamed tabs / rows / collapsibles. */
function flatten(fields: Field[]): Field[] {
  return fields.flatMap((f) => {
    if (f.type === 'tabs') {
      return f.tabs.flatMap((tab) =>
        'name' in tab && tab.name
          ? [{ ...tab, type: 'group' } as unknown as Field]
          : flatten(tab.fields),
      )
    }
    if ((f.type === 'row' || f.type === 'collapsible') && 'fields' in f) return flatten(f.fields)
    return [f]
  })
}

/**
 * The Arabic label of the field at `path` (e.g. «وصف مختصر (للبطاقة)»), so the
 * editor sees which box to fix — not «shortDescription».
 */
export function labelFor(fields: Field[] | undefined, path: string): string | undefined {
  let current: Field[] | undefined = fields
  let label: string | undefined
  for (const segment of path.split('.')) {
    if (!current) return label
    if (/^\d+$/.test(segment)) continue // row number in a list
    const field = flatten(current).find((f) => 'name' in f && f.name === segment)
    if (!field) return label
    if ('label' in field && typeof field.label === 'string') label = field.label
    if (field.type === 'blocks') {
      // the next segment is the row number; look the field up in every section type
      current = field.blocks.flatMap((b) => b.fields)
      continue
    }
    current = 'fields' in field ? (field.fields as Field[]) : undefined
  }
  return label
}

function check(
  data: unknown,
  target: { collection?: string; global?: string },
  fields: Field[] | undefined,
  req: PayloadRequest,
) {
  const problems: Problem[] = []
  scan(data, [], problems)
  if (problems.length) {
    for (const p of problems) {
      const field = labelFor(fields, p.path)
      // The toast shows «label» only — put the reason there too, so it says what to change.
      p.label = field ? `«${field}» — ${p.message}` : p.message
    }
    throw new ValidationError({ ...target, errors: problems, req }, req.t)
  }
}

/**
 * Blocks prices and job-guarantee wording anywhere in a document (CLAUDE.md rules 1+2).
 */
export const enforceContentRules: CollectionBeforeValidateHook = ({ data, collection, req }) => {
  check(data, { collection: collection.slug }, collection.fields, req)
  return data
}

export const enforceContentRulesGlobal: GlobalBeforeValidateHook = ({ data, global, req }) => {
  check(data, { global: global.slug }, global.fields, req)
  return data
}
