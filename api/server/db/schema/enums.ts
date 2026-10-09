/**
 * Domain enums.
 *
 * Kept in one place so the API contract, the DB constraints and the frontend
 * types can all be checked against a single source of truth.
 *
 * These map to real PostgreSQL `ENUM` types (see `pgEnums`), so an invalid
 * role can never be written even by a buggy query.
 */

/** Who is allowed to do what. */
export const ROLES = ['customer', 'manager', 'superadmin'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Lifecycle of a help item.
 *
 * `pending`   authored by a manager, awaiting superadmin review
 * `approved`  published, visible to customers
 * `rejected`  sent back with a reason, editable by the manager
 */
export const HELP_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type HelpStatus = (typeof HELP_STATUSES)[number];

/** Soft-delete / retire flag, kept separate from review status. */
export const ARCHIVE_STATUSES = ['active', 'archived'] as const;
export type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number];

/** The kind of content a help item points at. */
export const CONTENT_TYPES = ['video', 'image', 'pdf', 'text', 'link'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Every auditable state change, so the history is replayable. */
export const REVIEW_ACTIONS = [
  'created',
  'submitted',
  'approved',
  'rejected',
  'resubmitted',
  'archived',
  'restored',
] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

/**
 * Roles permitted to author or manage help content.
 * Customers are read-only by design.
 */
export const AUTHOR_ROLES = ['manager', 'superadmin'] as const satisfies readonly Role[];

/**
 * Roles the superadmin is allowed to provision.
 * Superadmins can only be created by the one-time setup endpoint, so this list
 * deliberately omits `superadmin` — that prevents privilege escalation through
 * the user-management API.
 */
export const ASSIGNABLE_ROLES = ['manager', 'customer'] as const satisfies readonly Role[];
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];
