import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
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

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  refreshSite()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  refreshSite()
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc }) => {
  refreshSite()
  return doc
}
