/**
 * Media upload business logic.
 *
 * The flow is deliberately two steps:
 *
 *   1. POST a description of the file  -> get a presigned PUT URL
 *   2. PUT the bytes straight to S3      -> no API involvement
 *   3. POST the returned key            -> record the asset
 *
 * Step 2 goes browser-to-S3, so no file bytes ever pass through this process.
 * That is what keeps memory flat under load and lets this run in a small
 * container.
 *
 * Step 3 exists because step 2 can silently fail — a dropped connection looks
 * identical to a success from the browser's side. Confirming afterwards is how
 * the database reflects only uploads that actually landed.
 */
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db, schema } from '../../db/client.js';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import type { TokenPayload } from '../../lib/jwt.js';
import { buildStorageKey, createUploadUrl, publicUrlForKey } from './storage.js';
import { MAX_UPLOAD_BYTES, UPLOADABLE_TYPES } from './media.schemas.js';
import type { ConfirmUploadInput, MediaAsset, PresignUploadInput } from './media.schemas.js';

/**
 * Maps a MIME type onto the help-content vocabulary.
 *
 * Rejects anything outside the allowlist before a presigned URL is issued —
 * once the client holds a URL, this server is no longer in the path.
 */
const MIME_TO_CONTENT_TYPE: Record<string, 'image' | 'pdf' | 'video' | 'text'> = {
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'application/pdf': 'pdf',
  'video/mp4': 'video',
  'video/webm': 'video',
  'text/plain': 'text',
  'text/markdown': 'text',
  'text/csv': 'text',
};

/**
 * Only manager and superadmin may upload.
 *
 * Mirrors the rule on `POST /api/help`: customers are read-only by design.
 */
const assertCanUpload = (auth: TokenPayload): void => {
  if (auth.role !== 'manager' && auth.role !== 'superadmin') {
    throw forbidden('Only a manager or superadmin can upload files');
  }
};

/**
 * Maps a stored row to the API shape, resolving the public URL.
 *
 * The URL is derived, not stored — the row is the source of truth. Resolving it
 * needs the provider the first time, so a storage outage (or an unconfigured
 * token in tests) degrades to a null url rather than failing the whole listing.
 * Clients can still reach the object via `storageKey`.
 */
async function toAsset(row: typeof schema.mediaAssets.$inferSelect): Promise<MediaAsset> {
  let url: string | null = null;
  try {
    url = (await publicUrlForKey(row.storageKey)) ?? null;
  } catch {
    // Intentionally swallowed: see above. Emitting one line per asset would be
    // log spam for what is a degraded-but-usable state.
  }

  return {
    id: row.id,
    helpItemId: row.helpItemId,
    folderId: row.folderId,
    filename: row.filename,
    storageKey: row.storageKey,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Verifies a folder exists in the caller's tenant.
 *
 * Without this, a caller could attach assets to a folder id belonging to another
 * tenant simply by knowing the UUID.
 */
async function assertFolderInTenant(folderId: string, auth: TokenPayload): Promise<void> {
  const row = await db.query.helpFolders.findFirst({
    where: and(eq(schema.helpFolders.id, folderId), eq(schema.helpFolders.tenantId, auth.tenantId)),
    columns: { id: true },
  });
  if (!row) throw notFound('Folder not found');
}

/** Same tenant check for a help item. */
async function assertItemInTenant(itemId: string, auth: TokenPayload): Promise<void> {
  const row = await db.query.helpItems.findFirst({
    where: and(eq(schema.helpItems.id, itemId), eq(schema.helpItems.tenantId, auth.tenantId)),
    columns: { id: true },
  });
  if (!row) throw notFound('Help item not found');
}

/**
 * Step 1 — issue a presigned PUT URL.
 *
 * `folderId` from the URL is the default owner; a `helpItemId` in the body
 * overrides it, because an item may live in a different folder than the one
 * being browsed.
 */
export async function presignUpload(
  input: PresignUploadInput,
  folderId: string | null,
  auth: TokenPayload,
): Promise<{
  uploadUrl: string;
  headers: Record<string, string>;
  storageKey: string;
  publicUrl: string | undefined;
  expiresAt: string;
}> {
  assertCanUpload(auth);

  const contentType = MIME_TO_CONTENT_TYPE[input.mimeType];
  if (!contentType) {
    throw badRequest(
      `Unsupported file type "${input.mimeType}". Allowed: ${Object.keys(MIME_TO_CONTENT_TYPE).join(', ')}`,
    );
  }
  if (input.sizeBytes > MAX_UPLOAD_BYTES) {
    throw badRequest(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit`);
  }

  if (folderId) await assertFolderInTenant(folderId, auth);
  if (input.helpItemId) await assertItemInTenant(input.helpItemId, auth);

  const storageKey = buildStorageKey({
    tenantId: auth.tenantId,
    filename: input.filename,
    mimeType: input.mimeType,
  });

  const signed = await createUploadUrl({
    key: storageKey,
    mimeType: input.mimeType,
    // Pinned into the signature, so the URL cannot be reused for a bigger body.
    sizeBytes: input.sizeBytes,
  });

  return {
    uploadUrl: signed.url,
    // Part of the signature; the client must send them verbatim or the PUT 403s.
    headers: signed.headers,
    storageKey,
    publicUrl: await publicUrlForKey(storageKey),
    expiresAt: signed.expiresAt.toISOString(),
  };
}

/** The content type a stored asset maps to, for use as `help_items.content_type`. */
export function contentTypeForMime(mimeType: string): (typeof UPLOADABLE_TYPES)[number] | null {
  return MIME_TO_CONTENT_TYPE[mimeType] ?? null;
}

/**
 * Step 3 — record a completed upload.
 *
 * The key is echoed back from step 1, but it is still checked against this
 * tenant's prefix. A client could otherwise submit a key belonging to someone
 * else and get a public URL for their object.
 */
export async function confirmUpload(
  input: ConfirmUploadInput,
  folderId: string | null,
  auth: TokenPayload,
): Promise<MediaAsset> {
  assertCanUpload(auth);

  if (!input.storageKey.startsWith(`${auth.tenantId}/`)) {
    throw forbidden('That storage key does not belong to this tenant');
  }
  if (folderId) await assertFolderInTenant(folderId, auth);

  const filename = input.storageKey.split('/').pop() ?? 'file';
  const mimeType = guessMimeFromKey(input.storageKey);

  const [row] = await db
    .insert(schema.mediaAssets)
    .values({
      helpItemId: null,
      folderId,
      filename,
      storageKey: input.storageKey,
      mimeType,
      sizeBytes: input.sizeBytes,
      tenantId: auth.tenantId,
    })
    .returning();

  return toAsset(row);
}

/**
 * Derives a MIME type from the stored key's extension.
 *
 * Only used for the record's bookkeeping column. Serving does not depend on it:
 * the browser reads `Content-Type` from the presigned PUT and from S3.
 */
function guessMimeFromKey(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase();
  const byExtension: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
  };
  return (extension && byExtension[extension]) || 'application/octet-stream';
}

/** Lists assets attached directly to a folder. */
export async function listFolderAssets(folderId: string, auth: TokenPayload): Promise<MediaAsset[]> {
  // Verify the folder exists in this tenant first, so an unknown id 404s
  // instead of returning an empty list that looks like a real, empty folder.
  await assertFolderInTenant(folderId, auth);

  const rows = await db
    .select()
    .from(schema.mediaAssets)
    .where(
      and(
        eq(schema.mediaAssets.folderId, folderId),
        eq(schema.mediaAssets.tenantId, auth.tenantId),
      ),
    )
    .orderBy(asc(schema.mediaAssets.createdAt));

  return Promise.all(rows.map(toAsset));
}

/** Lists assets attached to a help item. */
export async function listItemAssets(itemId: string, auth: TokenPayload): Promise<MediaAsset[]> {
  const rows = await db
    .select()
    .from(schema.mediaAssets)
    .where(
      and(
        eq(schema.mediaAssets.helpItemId, itemId),
        eq(schema.mediaAssets.tenantId, auth.tenantId),
      ),
    )
    .orderBy(asc(schema.mediaAssets.createdAt));

  return Promise.all(rows.map(toAsset));
}

/**
 * Deletes an asset record.
 *
 * The S3 object is NOT removed. Doing so synchronously would make this request
 * depend on S3 being reachable, and a bucket configured without delete
 * permission would turn cleanup into a hard failure. Object lifecycle rules
 * should expire orphaned blobs instead — this table is the source of truth.
 */
export async function deleteAsset(assetId: string, auth: TokenPayload): Promise<void> {
  const row = await db.query.mediaAssets.findFirst({
    where: and(
      eq(schema.mediaAssets.id, assetId),
      eq(schema.mediaAssets.tenantId, auth.tenantId),
    ),
  });
  if (!row) throw notFound('Asset not found');

  await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, assetId));
}

/** Assets belonging to no folder (the `root` pseudo-folder). */
export async function listRootAssets(auth: TokenPayload): Promise<MediaAsset[]> {
  const rows = await db
    .select()
    .from(schema.mediaAssets)
    .where(
      and(
        isNull(schema.mediaAssets.folderId),
        isNull(schema.mediaAssets.helpItemId),
        eq(schema.mediaAssets.tenantId, auth.tenantId),
      ),
    )
    .orderBy(asc(schema.mediaAssets.createdAt));

  return Promise.all(rows.map(toAsset));
}