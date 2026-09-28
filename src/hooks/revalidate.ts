import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

/** Refresh every website page right after an editor saves, instead of waiting for the cache. */
function refreshSite() {
  try {
    revalidateTag('site', { expire: 0 })
    revalidatePath('/', 'layout')
  } catch {
    // Outside a Next.js request (e.g. the seed script) there is nothing to refresh.
  }
}

const isTrue = (v: unknown) => v === true || v === 'true'

/**
 * A draft save (autosave while typing, or «حفظ كمسودة») only adds a new draft version: the
 * published content that visitors see does not change, so the website cache is kept.
 * Publishing, unpublishing, deleting and every save of content without drafts still refresh the
 * site. Same rule Payload itself uses to decide whether the published document is touched
 * (`isSavingDraft` in payload/…/operations/update); anything else — or a save from code, which
 * has no `?draft=true` — refreshes, to be safe. Live preview does not need the cache cleared:
 * draft mode always renders fresh.
 */
function isDraftOnlySave(req: PayloadRequest, data: unknown, hasDrafts: boolean) {
  if (!hasDrafts) return false
  const q = (req.query ?? {}) as Record<string, unknown>
  const status = (data as { _status?: string } | undefined)?._status
  return (
    isTrue(q.draft) &&
    status !== 'published' &&
    !isTrue(q.publishAllLocales) &&
    !isTrue(q.unpublishAllLocales) &&
    !q.publishSpecificLocale
  )
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({
  collection,
  data,
  doc,
  operation,
  req,
}) => {
  const drafts = Boolean(collection.versions?.drafts)
  if (!(operation === 'update' && isDraftOnlySave(req, data, drafts))) refreshSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  refreshSite()
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ data, doc, global, req }) => {
  if (!isDraftOnlySave(req, data, Boolean(global.versions?.drafts))) refreshSite()
  return doc
}
