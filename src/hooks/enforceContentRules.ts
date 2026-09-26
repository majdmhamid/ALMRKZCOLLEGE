import type { CollectionBeforeValidateHook, GlobalBeforeValidateHook } from 'payload'
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

type Problem = { path: string; message: string }

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

function check(data: unknown, target: { collection?: string; global?: string }) {
  const problems: Problem[] = []
  scan(data, [], problems)
  if (problems.length) {
    throw new ValidationError({ ...target, errors: problems })
  }
}

/**
 * Blocks prices and job-guarantee wording anywhere in a document (CLAUDE.md rules 1+2).
 */
export const enforceContentRules: CollectionBeforeValidateHook = ({ data, collection }) => {
  check(data, { collection: collection.slug })
  return data
}

export const enforceContentRulesGlobal: GlobalBeforeValidateHook = ({ data, global }) => {
  check(data, { global: global.slug })
  return data
}
