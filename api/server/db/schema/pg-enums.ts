import { pgEnum } from 'drizzle-orm/pg-core';
import {
  ARCHIVE_STATUSES,
  CONTENT_TYPES,
  HELP_STATUSES,
  REVIEW_ACTIONS,
  ROLES,
} from './enums.js';

/**
 * PostgreSQL ENUM types.
 *
 * Each enum is a TOP-LEVEL export, referenced directly by the tables.
 * (An earlier version grouped them in a `pgEnums` object; drizzle-kit's
 * static analysis could not follow that indirection and silently dropped all
 * five types from the generated migration — tables were created referencing
 * types that did not exist.)
 *
 * Declared once and reused by every table, so the database itself rejects
 * invalid roles and statuses. Adding a value later is an `ALTER TYPE`, which
 * is why the lists in `enums.ts` stay deliberately small and stable.
 */
export const roleEnum = pgEnum('role', ROLES);
export const helpStatusEnum = pgEnum('help_status', HELP_STATUSES);
export const archiveStatusEnum = pgEnum('archive_status', ARCHIVE_STATUSES);
export const contentTypeEnum = pgEnum('content_type', CONTENT_TYPES);
export const reviewActionEnum = pgEnum('review_action', REVIEW_ACTIONS);
