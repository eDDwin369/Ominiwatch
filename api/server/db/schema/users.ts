import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { roleEnum } from './pg-enums.js';
import { ROLES } from './enums.js';

/**
 * Application users.
 *
 * `password_hash` is a bcrypt digest — plaintext passwords are never stored.
 * `tenant_id` scopes every query, so multi-tenant isolation is enforceable now
 * rather than retrofitted later.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('customer'),
    tenantId: text('tenant_id').notNull().default('default'),

    /**
     * True until the owner picks their own password.
     *
     * Set for accounts a superadmin provisions: the temporary password works
     * for login, but the API forces a change before anything else, so the
     * superadmin never has to communicate a durable credential.
     */
    mustChangePassword: boolean('must_change_password').notNull().default(false),

    isActive: boolean('is_active').notNull().default(true),

    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Case-insensitive uniqueness: two accounts differing only in case would
    // otherwise be a duplicate.
    uniqueIndex('users_email_unique').on(sql`lower(${t.email})`),
    index('users_tenant_idx').on(t.tenantId),
    index('users_role_idx').on(t.role),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

/**
 * The safe-to-send projection of a user.
 * `passwordHash` is excluded by construction, not by convention.
 */
export const publicUserColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  tenantId: users.tenantId,
  isActive: users.isActive,
  mustChangePassword: users.mustChangePassword,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
} as const;

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: (typeof ROLES)[number];
  tenantId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};
