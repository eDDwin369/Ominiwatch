/**
 * Object storage via Upstash Blob.
 *
 * The ONLY module that knows the storage provider. Everything else asks for an
 * upload URL or a public URL and never sees a credential.
 *
 * Uploads are presigned: the API authorises and records the asset, then the
 * browser PUTs the bytes straight to the bucket. No file passes through this
 * process, which is what keeps memory flat regardless of file size — the reason
 * this is not a server-side `PutObjectCommand`.
 *
 * Upstash hands out short-lived credentials through `bucket.s3()` and refreshes
 * them, so there is no long-lived AWS key pair anywhere. Config is a single
 * write-scoped token.
 */
import { Bucket } from '@upstash/blob';
import { env } from '../../config/env.js';

/**
 * Lazily constructed, one client for the process.
 *
 * Lazy rather than at module scope because `new Bucket()` validates the token
 * format immediately: a module-scope client would make *importing* this file
 * fail on a placeholder or absent token, which takes down the whole app at boot
 * even when nothing uploads. Building on first use means a misconfigured token
 * surfaces at the first upload instead, and read paths that never resolve a URL
 * keep working.
 */
let bucketClient: Bucket | null = null;

function bucket(): Bucket {
  if (!bucketClient) {
    bucketClient = new Bucket({ token: env.UPSTASH_BLOB_TOKEN });
  }
  return bucketClient;
}

/**
 * Public URL for a stored object, as written to `contentUrl` on a help item.
 *
 * Returns undefined on a private bucket, where nothing serves objects over the
 * public host. This deployment uses a public bucket; if that ever changes,
 * switch to `signedReadUrl` and store the key instead of a URL.
 */
export async function publicUrlForKey(key: string): Promise<string | undefined> {
  return bucket().publicUrl(key);
}

/**
 * Builds the object key for a new upload.
 *
 * Tenant-scoped and date-prefixed so listing by prefix is cheap and one tenant
 * can never overwrite another's object. The random component is what guarantees
 * uniqueness — the filename is a readable suffix, so two uploads of
 * `invoice.pdf` cannot collide.
 */
export function buildStorageKey(params: {
  tenantId: string;
  filename: string;
  mimeType: string;
}): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const date = new Date().toISOString().slice(0, 10);
  return `${params.tenantId}/${date}/${random}-${sanitiseFilename(params.filename)}`;
}

/**
 * Strips directory components and anything that is not a safe filename
 * character.
 *
 * The key is attacker-influenced, so a name like `../../etc/passwd` must not be
 * able to escape its prefix.
 */
function sanitiseFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? 'file';
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '_')
    .slice(0, 120);
  return cleaned || 'file';
}

/**
 * Issues a presigned PUT for one object.
 *
 * `size` and `contentType` are pinned into the signature, so a URL minted for a
 * 2 KB PDF cannot be reused to upload something else — Upstash rejects a
 * mismatch rather than trusting the client.
 */
export async function createUploadUrl(params: {
  key: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ url: string; headers: Record<string, string>; expiresAt: Date }> {
  const signed = await bucket().signedUploadUrl(params.key, {
    // The bucket caps this at 10 minutes; asking for more is clamped, not an error.
    expiresIn: '10m',
    contentType: params.mimeType,
    size: params.sizeBytes,
    // A retry of the same upload should overwrite, not fail on an existing object.
    allowOverwrite: true,
  });

  return { url: signed.url, headers: signed.headers, expiresAt: signed.expiresAt };
}

/** Removes an object. Used only when an asset record is deliberately purged. */
export async function deleteObject(key: string): Promise<void> {
  await bucket().del(key);
}

/**
 * Whether an object exists.
 *
 * Lets the confirm step reject a key whose upload never actually landed, rather
 * than recording an asset that points at nothing.
 */
export async function objectExists(key: string): Promise<boolean> {
  return bucket().exists(key);
}