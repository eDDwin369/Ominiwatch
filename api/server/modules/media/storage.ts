/**
 * Object storage via Upstash Blob & S3-compatible client.
 *
 * Upstash hands out short-lived S3-compatible credentials through `bucket.s3()`
 * and refreshes them automatically for the S3Client.
 */
import { Bucket } from '@upstash/blob';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../../config/env.js';

let bucketClient: Bucket | null = null;
let s3Client: S3Client | null = null;

function getStorage() {
  if (!bucketClient) {
    bucketClient = new Bucket({ token: env.UPSTASH_BLOB_TOKEN });
    const config = bucketClient.s3();
    s3Client = new S3Client(config);
  }
  return {
    bucket: bucketClient,
    s3: s3Client!,
    config: bucketClient.s3(),
  };
}

function bucket(): Bucket {
  return getStorage().bucket;
}

/**
 * Directly upload an object using S3Client and PutObjectCommand.
 */
export async function uploadObjectDirect(params: {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType?: string;
}): Promise<void> {
  const { s3, config } = getStorage();
  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
}

/**
 * Public URL for a stored object.
 */
export async function publicUrlForKey(key: string): Promise<string | undefined> {
  return bucket().publicUrl(key);
}

/**
 * Builds the object key for a new upload.
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

function sanitiseFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? 'file';
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '_')
    .slice(0, 120);
  return cleaned || 'file';
}

/**
 * Issues a presigned PUT for browser direct uploads.
 */
export async function createUploadUrl(params: {
  key: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ url: string; headers: Record<string, string>; expiresAt: Date }> {
  const signed = await bucket().signedUploadUrl(params.key, {
    expiresIn: '10m',
    contentType: params.mimeType,
    size: params.sizeBytes,
    allowOverwrite: true,
  });

  return { url: signed.url, headers: signed.headers, expiresAt: signed.expiresAt };
}

/** Removes an object. */
export async function deleteObject(key: string): Promise<void> {
  await bucket().del(key);
}

/** Whether an object exists. */
export async function objectExists(key: string): Promise<boolean> {
  return bucket().exists(key);
}
