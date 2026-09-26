import type { Access, FieldAccess, PayloadRequest } from 'payload'

export type Role = 'admin' | 'editor'

type UserLike = { roles?: Role[] | null } | null | undefined

export const hasRole = (user: UserLike, role: Role) => Boolean(user?.roles?.includes(role))

export const isAdminUser = (req: PayloadRequest) => hasRole(req.user as UserLike, 'admin')

/** Admin: everything (users, leads, settings). */
export const isAdmin: Access = ({ req }) => isAdminUser(req)
export const isAdminField: FieldAccess = ({ req }) => isAdminUser(req)

/** Admin or editor: all website content. */
export const isStaff: Access = ({ req }) => Boolean(req.user)
export const isStaffField: FieldAccess = ({ req }) => Boolean(req.user)

export const anyone: Access = () => true

/**
 * Public visitors only see published documents; logged-in staff see drafts too
 * (needed for preview).
 */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

/** Admins manage every user; editors may only read/update themselves. */
export const adminOrSelf: Access = ({ req }) => {
  if (isAdminUser(req)) return true
  if (req.user) return { id: { equals: req.user.id } }
  return false
}
