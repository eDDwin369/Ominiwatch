/**
 * Test helpers: authenticated supertest requests.
 *
 * This service has no auth API — accounts and sign-in belong to the system that
 * hosts it. So tests do not log in. They insert the user rows the content FKs
 * require and mint a token directly with the same library the middleware
 * verifies with.
 *
 * That makes the tests faster and more honest: they exercise the help-management
 * rules, not an account lifecycle that is no longer part of this service.
 */
import request from 'supertest';
import type { Express } from 'express';
import { getApp } from './setup.js';

export { request };

async function testApp(): Promise<Express> {
  return (await getApp()) as unknown as Express;
}

export type Role = 'superadmin' | 'manager' | 'customer';

/** The tenant every test fixture lives in. */
export const TEST_TENANT = 'default';

/**
 * Creates a user row and returns bearer headers for it.
 *
 * The password hash is a placeholder: nothing in this service authenticates a
 * password any more, and the column is only NOT NULL.
 */
export async function createActor(
  email: string,
  role: Role,
  tenantId: string = TEST_TENANT,
): Promise<{ id: string; headers: Record<string, string>; email: string }> {
  const { db, schema } = await import('../db/client.js');
  const { signAccessToken } = await import('../lib/jwt.js');

  const [row] = await db
    .insert(schema.users)
    .values({
      email,
      name: `Test ${role}`,
      passwordHash: 'not-a-real-hash',
      role,
      tenantId,
      mustChangePassword: false,
      isActive: true,
    })
    .returning();

  return {
    id: row.id,
    email: row.email,
    headers: {
      Authorization: `Bearer ${signAccessToken({
        sub: row.id,
        role: row.role,
        tenantId: row.tenantId,
      })}`,
    },
  };
}

type Actor = Record<string, string>;

type Actors = {
  superadmin: Actor;
  manager: Actor;
  customer: Actor;
  /** User ids, for the few tests that need to reference the actor row itself. */
  ids: { superadmin: string; manager: string; customer: string };
};

const provisioned = new Map<string, Actors>();

/**
 * Returns bearer headers for superadmin, manager and customer.
 *
 * The values ARE the headers objects, so call sites read `request(app).set(manager)`.
 * Memoized per suffix — the database is reset once per file, not per test, so
 * repeated calls must reuse the same user rows.
 */
export async function provisionRoleAccounts(suffix: string): Promise<Actors> {
  const cached = provisioned.get(suffix);
  if (cached) return cached;

  // Ensure the app (and therefore the schema) is initialised before inserting.
  await testApp();

  const superadmin = await createActor(`superadmin.${suffix}@example.com`, 'superadmin');
  const manager = await createActor(`manager.${suffix}@example.com`, 'manager');
  const customer = await createActor(`customer.${suffix}@example.com`, 'customer');

  const result: Actors = {
    superadmin: superadmin.headers,
    manager: manager.headers,
    customer: customer.headers,
    ids: {
      superadmin: superadmin.id,
      manager: manager.id,
      customer: customer.id,
    },
  };

  provisioned.set(suffix, result);
  return result;
}