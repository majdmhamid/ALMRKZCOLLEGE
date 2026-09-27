import { notFound } from 'next/navigation'

/**
 * Any unknown address inside /ar/... or /he/... → the 404 page of that language
 * ([locale]/not-found.tsx), with the site's header and footer. Real pages always win over this one.
 */
export default function Missing() {
  notFound()
}
