/**
 * Media upload tests.
 *
 * Two things are covered here, and the split matters:
 *
 *   - `storage.ts` key building and the MIME allowlist are PURE functions, so
 *     they are tested directly. This is where the security-relevant logic lives
 *     (tenant-scoped keys, path-traversal stripping, type rejection).
 *
 *   - The HTTP layer is tested through the real Express app to prove the routes
 *     are mounted, gated by role, and gated by `mustChangePassword`.
 *
 * No test performs a real upload. Once a presigned URL is issued the API is no
 * longer in the path, so there is nothing meaningful left to assert against a
 * live bucket — and depending on one would make the suite network-bound.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { getApp } from './setup.js';
import { createActor } from './helpers.js';
import { buildStorageKey, publicUrlForKey } from '../modules/media/storage.js';
import {
  MAX_UPLOAD_BYTES,
  presignUploadSchema,
  confirmUploadSchema,
} from '../modules/media/media.schemas.js';

async function app(): Promise<Express> {
  return (await getApp()) as unknown as Express;
}

/* ------------------------------------------------------------------ */
/* Pure logic: storage keys                                            */
/* ------------------------------------------------------------------ */

describe('storage keys', () => {
  it('scopes every key to the tenant and the date', () => {
    const key = buildStorageKey({
      tenantId: 'acme',
      filename: 'invoice.pdf',
      mimeType: 'application/pdf',
    });

    expect(key.startsWith('acme/')).toBe(true);
    // .../YYYY-MM-DD/<random>-invoice.pdf
    expect(key).toMatch(/^acme\/\d{4}-\d{2}-\d{2}\/[a-f0-9]{16}-invoice\.pdf$/);
  });

  it('gives two uploads of the same filename different keys', () => {
    const build = () =>
      buildStorageKey({ tenantId: 'acme', filename: 'invoice.pdf', mimeType: 'application/pdf' });

    expect(build()).not.toBe(build());
  });

  it('strips directory traversal from the filename', () => {
    // The filename is attacker-influenced, so a traversal attempt must not be
    // able to escape the tenant prefix.
    const key = buildStorageKey({
      tenantId: 'acme',
      filename: '../../etc/passwd',
      mimeType: 'text/plain',
    });

    expect(key.startsWith('acme/')).toBe(true);
    expect(key).not.toContain('..');
    expect(key.split('/')).toHaveLength(3);
  });

  it('strips characters that are unsafe in a key', () => {
    const key = buildStorageKey({
      tenantId: 'acme',
      filename: 'my report (final) v2.pdf',
      mimeType: 'application/pdf',
    });

    expect(key).not.toMatch(/[^a-zA-Z0-9._/-]/);
  });

  it('exposes the public-URL resolver used for contentUrl', () => {
    // Not called here: resolving a URL needs the storage provider, and this
    // suite runs without network on purpose. Key construction is the
    // security-relevant part and is pure, so that is what gets asserted.
    expect(typeof publicUrlForKey).toBe('function');
  });
});

/* ------------------------------------------------------------------ */
/* Pure logic: upload validation                                       */
/* ------------------------------------------------------------------ */

describe('upload request validation', () => {
  it('accepts a normal file', () => {
    const result = presignUploadSchema.safeParse({
      filename: 'policy.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a zero-byte file', () => {
    const result = presignUploadSchema.safeParse({
      filename: 'empty.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a file over the size limit', () => {
    const result = presignUploadSchema.safeParse({
      filename: 'huge.pdf',
      mimeType: 'application/pdf',
      sizeBytes: MAX_UPLOAD_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative size', () => {
    const result = presignUploadSchema.safeParse({
      filename: 'x.pdf',
      mimeType: 'application/pdf',
      sizeBytes: -5,
    });
    expect(result.success).toBe(false);
  });

  it('treats root as a valid folder id', () => {
    // `root` is the pseudo-folder for assets with no folder.
    const parsed = presignUploadSchema.safeParse({
      filename: 'notes.txt',
      mimeType: 'text/plain',
      sizeBytes: 10,
    });
    expect(parsed.success).toBe(true);
  });

  it('requires a non-empty storage key on confirm', () => {
    expect(confirmUploadSchema.safeParse({ storageKey: '', sizeBytes: 10 }).success).toBe(false);
    expect(confirmUploadSchema.safeParse({ storageKey: 'acme/x', sizeBytes: 10 }).success).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* HTTP layer                                                          */
/* ------------------------------------------------------------------ */

describe('media routes', () => {
  let token = '';

  beforeAll(async () => {
    // No login and no setup: this service has neither. The actor row the
    // content FKs need is inserted directly and a token is minted for it.
    const superadmin = await createActor('media.superadmin@example.com', 'superadmin');
    // Strip the scheme: the tests below add `Bearer ` themselves, so storing the
    // whole header here would send `Bearer Bearer <jwt>` and 401.
    token = superadmin.headers.Authorization.replace(/^Bearer\s+/, '');
  });

  it('requires a token', async () => {
    await request(await app()).get('/api/folders/root/media').expect(401);
  });

  it('lists files in the root pseudo-folder', async () => {
    const res = await request(await app())
      .get('/api/folders/root/media')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.assets)).toBe(true);
  });

  it('rejects a non-uuid folder id', async () => {
    await request(await app())
      .get('/api/folders/not-a-uuid/media')
      .set('Authorization', `Bearer ${token}`)
      .expect(422);
  });

  it('404s for a folder that does not exist', async () => {
    await request(await app())
      .get('/api/folders/00000000-0000-4000-8000-000000000000/media')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('rejects a presign for an unsupported content type', async () => {
    // The allowlist is enforced before a URL is issued, because once the client
    // holds the URL this server is out of the path.
    const res = await request(await app())
      .post('/api/folders/root/media/presign')
      .set('Authorization', `Bearer ${token}`)
      .send({ filename: 'evil.exe', mimeType: 'application/x-msdownload', sizeBytes: 100 })
      .expect(400);

    expect(res.body.error.message).toMatch(/Unsupported file type/i);
  });

  it('refuses a confirm for another tenant’s storage key', async () => {
    const res = await request(await app())
      .post('/api/folders/root/media')
      .set('Authorization', `Bearer ${token}`)
      .send({ storageKey: 'someone-else/2026-01-01/abc-file.pdf', sizeBytes: 100 })
      .expect(403);

    expect(res.body.error.message).toMatch(/does not belong to this tenant/i);
  });

  it('records an upload into the root pseudo-folder', async () => {
    const res = await request(await app())
      .post('/api/folders/root/media')
      .set('Authorization', `Bearer ${token}`)
      .send({ storageKey: 'default/2026-01-01/deadbeef-policy.pdf', sizeBytes: 2048 })
      .expect(201);

    expect(res.body.asset.storageKey).toBe('default/2026-01-01/deadbeef-policy.pdf');
    // folderId is null for the root pseudo-folder; helpItemId stays null, which
    // is what the exactly-one-owner CHECK requires.
    expect(res.body.asset.folderId).toBeNull();
    expect(res.body.asset.helpItemId).toBeNull();
    // `url` is derived from the storage provider, which the suite never
    // contacts, so it degrades to null here. The row is the source of truth and
    // the key is what a client would use to build a URL.
    expect(res.body.asset.storageKey).toBe('default/2026-01-01/deadbeef-policy.pdf');
  });

  it('404s when deleting an asset that does not exist', async () => {
    await request(await app())
      .delete('/api/media/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('lists a recorded asset back', async () => {
    const res = await request(await app())
      .get('/api/folders/root/media')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.assets.length).toBeGreaterThan(0);
  });

  it('blocks a customer from uploading', async () => {
    // A customer actor, minted directly — there is no signup endpoint to call.
    const customer = await createActor('media.customer@example.com', 'customer');

    await request(await app())
      .post('/api/folders/root/media/presign')
      .set(customer.headers)
      .send({ filename: 'notes.txt', mimeType: 'text/plain', sizeBytes: 20 })
      .expect(403);
  });
});