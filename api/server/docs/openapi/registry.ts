/**
 * OpenAPI registry — help management only.
 *
 * Scope is deliberately limited to `/api/help`, `/api/folders` and `/api/media`.
 * This service has no setup, auth or user-management API at all — accounts and
 * sign-in belong to the system that hosts it — so there is nothing else to
 * document.
 *
 * The security scheme IS declared, because every route requires a bearer token.
 * Nothing here issues one; tokens are minted by the host system and verified
 * against the shared JWT_SECRET.
 *
 * Every schema registered here is the SAME Zod object the route validates with,
 * so the published contract cannot drift from the enforced one.
 */
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { HELP_STATUSES, CONTENT_TYPES } from '../../db/schema/enums.js';
import { errorEnvelopeSchema } from './schemas.js';
import {
  createFolderSchema,
  updateFolderSchema,
  folderIdParam,
  listFolderContentsQuerySchema,
  deleteFolderQuerySchema,
} from '../../modules/folders/folders.schemas.js';
import {
  assetIdParam,
  confirmUploadSchema,
  presignUploadSchema,
  uploadTargetSchema,
  MAX_UPLOAD_BYTES,
} from '../../modules/media/media.schemas.js';
import {
  createHelpItemSchema,
  updateHelpItemSchema,
  reviewHelpItemSchema,
  listHelpItemsQuerySchema,
  idParam as helpItemIdParam,
} from '../../modules/help/help.schemas.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

/* ------------------------------------------------------------------ */
/* Security                                                            */
/* ------------------------------------------------------------------ */

/**
 * Every route in this document requires a token. Declared so operations can be
 * called directly from the reference.
 */
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description:
    'A bearer JWT minted by the host system that runs this API. Tokens are ' +
    'verified here against the shared JWT_SECRET; this service issues none. ' +
    'Tokens are tenant-scoped, so the data returned is limited to what the ' +
    'account may see.',
});

/* ------------------------------------------------------------------ */
/* Shared schemas                                                      */
/* ------------------------------------------------------------------ */

const folderSchema = registry.register(
  'Folder',
  z
    .object({
      id: z.uuid(),
      name: z.string(),
      description: z.string(),
      parentId: z.uuid().nullable().describe('Null when the folder sits at the root.'),
      createdBy: z.uuid(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .describe('A node in the help folder tree.'),
);

const helpItemSchema = registry.register(
  'HelpItem',
  z
    .object({
      id: z.uuid(),
      title: z.string(),
      description: z.string(),
      contentType: z.enum(CONTENT_TYPES).describe('Kind of content this item points at.'),
      contentUrl: z.string().nullable(),
      body: z.string().nullable().describe('Populated for `text` items.'),
      contextKey: z.string().nullable().describe('Stable UI key, e.g. `billing.invoices.delete`.'),
      relatedContext: z.string().nullable().describe('Human-readable path shown in the UI.'),
      status: z
        .enum(HELP_STATUSES)
        .describe(
          '`pending` awaits review, `approved` is visible to customers, `rejected` ' +
            'returns to the author with a reason.',
        ),
      folderId: z.uuid().nullable(),
      authorId: z.uuid(),
      approvedBy: z.uuid().nullable(),
      approvedAt: z.string().nullable(),
      rejectedBy: z.uuid().nullable(),
      rejectedAt: z.string().nullable(),
      rejectionReason: z.string().nullable(),
      contentVersion: z.number().int(),
      approvedContentVersion: z.number().int().nullable(),
      isArchived: z.boolean().describe('Soft-delete flag, independent of review status.'),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .describe('A single piece of help content and its review state.'),
);

const reviewEventSchema = registry.register(
  'ReviewEvent',
  z.object({
    id: z.uuid(),
    helpItemId: z.uuid(),
    action: z
      .enum(['created', 'submitted', 'approved', 'rejected', 'resubmitted', 'archived', 'restored'])
      .describe('Every auditable transition, so the history can be replayed.'),
    fromStatus: z.enum(HELP_STATUSES).nullable(),
    toStatus: z.enum(HELP_STATUSES).nullable(),
    reason: z.string().nullable(),
    actorId: z.uuid(),
    createdAt: z.string(),
  }),
);

/* ------------------------------------------------------------------ */
/* Response envelopes                                                  */
/* ------------------------------------------------------------------ */

const unauthorizedResponse = {
  description: 'Missing, malformed or expired token.',
  content: { 'application/json': { schema: errorEnvelopeSchema } },
} as const;

const forbiddenResponse = {
  description:
    'Authenticated, but the role is not permitted — or the account still has a temporary password.',
  content: { 'application/json': { schema: errorEnvelopeSchema } },
} as const;

const validationErrorResponse = {
  description: 'Request failed schema validation.',
  content: {
    'application/json': {
      schema: z.object({
        error: z.object({
          code: z.literal('UNPROCESSABLE'),
          message: z.string(),
          details: z
            .array(
              z.object({
                path: z.array(z.string()),
                message: z.string(),
              }),
            )
            .describe('One entry per invalid field, with its dotted path.'),
        }),
      }),
    },
  },
} as const;

const notFoundResponse = {
  description: 'No such resource in the caller’s tenant.',
  content: { 'application/json': { schema: errorEnvelopeSchema } },
} as const;

const jsonResponse = <T extends z.ZodType>(schema: T, description: string) =>
  ({ description, content: { 'application/json': { schema } } }) as const;

/** Surfaced in the upload docs so the limits are stated in one place. */
const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

/**
 * Mirrors the allowlist in `media.service.ts`. Kept here as documentation only —
 * the service is what actually enforces it, since once a presigned URL is
 * issued this API is no longer in the upload path.
 */
const UPLOADABLE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'text/plain',
  'text/markdown',
  'text/csv',
];

/* ------------------------------------------------------------------ */
/* Folders                                                             */
/* ------------------------------------------------------------------ */

registry.registerPath({
  method: 'get',
  path: '/api/folders',
  tags: ['Folders'],
  summary: 'The full folder tree',
  description:
    'Nested, root first. Read visibility is filtered per role in the service ' +
    'layer — a customer sees only folders reachable through approved content.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonResponse(z.object({ folders: z.array(folderSchema) }), 'The tree.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/folders/{id}/contents',
  tags: ['Folders'],
  summary: 'Child folders and help items inside one folder',
  description: '`scope=direct` returns only immediate children; `scope=all` returns every descendant.',
  security: [{ bearerAuth: [] }],
  request: { params: folderIdParam, query: listFolderContentsQuerySchema },
  responses: {
    200: jsonResponse(
      z.object({
        folders: z.array(folderSchema),
        items: z.array(helpItemSchema),
      }),
      'Folder contents.',
    ),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/folders/{id}/breadcrumb',
  tags: ['Folders'],
  summary: 'Root-to-here path',
  security: [{ bearerAuth: [] }],
  request: { params: folderIdParam },
  responses: {
    200: jsonResponse(z.object({ breadcrumb: z.array(folderSchema) }), 'Ancestors, root first.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/folders',
  tags: ['Folders'],
  summary: 'Create a folder',
  description: 'Manager or superadmin. Omit `parentId` (or send null) to create at the root.',
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createFolderSchema } } },
  },
  responses: {
    201: jsonResponse(z.object({ folder: folderSchema }), 'Folder created.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    422: validationErrorResponse,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/folders/{id}',
  tags: ['Folders'],
  summary: 'Rename or re-parent a folder',
  description: 'Manager or superadmin. Send `parentId: null` to move the folder to the root.',
  security: [{ bearerAuth: [] }],
  request: {
    params: folderIdParam,
    body: { content: { 'application/json': { schema: updateFolderSchema } } },
  },
  responses: {
    200: jsonResponse(z.object({ folder: folderSchema }), 'The updated folder.'),
    400: { description: 'The move would create a cycle in the tree.', content: { 'application/json': { schema: errorEnvelopeSchema } } },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: { description: 'A sibling folder already uses that name.', content: { 'application/json': { schema: errorEnvelopeSchema } } },
    422: validationErrorResponse,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/folders/{id}',
  tags: ['Folders'],
  summary: 'Delete a folder',
  description:
    'Manager or superadmin. Returns **409** while the folder still holds help items — pass ' +
    '`?moveItemsToRoot=true` to move them out instead of blocking the delete. Child folders ' +
    'are rejected when non-empty.',
  security: [{ bearerAuth: [] }],
  request: { params: folderIdParam, query: deleteFolderQuerySchema },
  responses: {
    200: jsonResponse(z.object({ deleted: z.literal(true) }), 'Folder deleted.'),
    400: { description: 'Refused — the folder still contains child folders.', content: { 'application/json': { schema: errorEnvelopeSchema } } },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    409: { description: 'Folder is not empty and moveItemsToRoot was not set.', content: { 'application/json': { schema: errorEnvelopeSchema } } },
  },
});

/* ------------------------------------------------------------------ */
/* Help                                                                */
/* ------------------------------------------------------------------ */

registry.registerPath({
  method: 'get',
  path: '/api/help',
  tags: ['Help'],
  summary: 'List help items',
  description:
    'Paginated and filterable. Customers are transparently limited to approved items — the ' +
    'service narrows the query by role, so no client-side filtering is needed.',
  security: [{ bearerAuth: [] }],
  request: { query: listHelpItemsQuerySchema },
  responses: {
    200: jsonResponse(
      z.object({
        items: z.array(helpItemSchema),
        pagination: z.object({
          page: z.number().int(),
          pageSize: z.number().int(),
          total: z.number().int(),
          totalPages: z.number().int(),
        }),
      }),
      'Matching items.',
    ),
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/help/stats',
  tags: ['Help'],
  summary: 'Status counters',
  description: 'Counts per review status, for dashboard tiles.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonResponse(
      z.object({
        pending: z.number().int(),
        approved: z.number().int(),
        rejected: z.number().int(),
        total: z.number().int(),
      }),
      'Counts by status.',
    ),
    401: unauthorizedResponse,
    403: forbiddenResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/help/{id}',
  tags: ['Help'],
  summary: 'Fetch one item',
  security: [{ bearerAuth: [] }],
  request: { params: helpItemIdParam },
  responses: {
    200: jsonResponse(z.object({ item: helpItemSchema }), 'The item.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/help/{id}/history',
  tags: ['Help'],
  summary: 'Audit trail for an item',
  description:
    'Authors and superadmins only. Every state change is recorded, so the review history can ' +
    'be replayed.',
  security: [{ bearerAuth: [] }],
  request: { params: helpItemIdParam },
  responses: {
    200: jsonResponse(z.object({ events: z.array(reviewEventSchema) }), 'Chronological events.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/help',
  tags: ['Help'],
  summary: 'Author a help item',
  description:
    'Manager or superadmin. Created as `pending`. `body` is required when `contentType` is ' +
    '`text`; `contentUrl` is required otherwise — both enforced by schema refinement, so a ' +
    'malformed item never reaches the database.',
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createHelpItemSchema } } },
  },
  responses: {
    201: jsonResponse(z.object({ item: helpItemSchema }), 'Item created as pending.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    422: validationErrorResponse,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/help/{id}',
  tags: ['Help'],
  summary: 'Edit an item',
  description: 'Author or superadmin only. Editing an approved item bumps its content version.',
  security: [{ bearerAuth: [] }],
  request: {
    params: helpItemIdParam,
    body: { content: { 'application/json': { schema: updateHelpItemSchema } } },
  },
  responses: {
    200: jsonResponse(z.object({ item: helpItemSchema }), 'The updated item.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    422: validationErrorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/help/{id}/review',
  tags: ['Help'],
  summary: 'Approve or reject (superadmin only)',
  description:
    'The core of the workflow. `approved` publishes the item to customers; `rejected` sends ' +
    'it back to the author and **requires** a reason, which the schema enforces.',
  security: [{ bearerAuth: [] }],
  request: {
    params: helpItemIdParam,
    body: { content: { 'application/json': { schema: reviewHelpItemSchema } } },
  },
  responses: {
    200: jsonResponse(z.object({ item: helpItemSchema }), 'Decision recorded.'),
    400: { description: 'The item is not in a reviewable state.', content: { 'application/json': { schema: errorEnvelopeSchema } } },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    422: validationErrorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/help/{id}/resubmit',
  tags: ['Help'],
  summary: 'Resubmit a rejected item',
  description: 'Author or superadmin. Moves `rejected` back to `pending` for another review.',
  security: [{ bearerAuth: [] }],
  request: { params: helpItemIdParam },
  responses: {
    200: jsonResponse(z.object({ item: helpItemSchema }), 'Back in the review queue.'),
    400: { description: 'Only rejected items can be resubmitted.', content: { 'application/json': { schema: errorEnvelopeSchema } } },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/help/{id}/archive',
  tags: ['Help'],
  summary: 'Archive (soft delete)',
  description:
    'Hidden from normal listings but preserved in history; reversible via restore.',
  security: [{ bearerAuth: [] }],
  request: { params: helpItemIdParam },
  responses: {
    200: jsonResponse(z.object({ item: helpItemSchema }), 'Item archived.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/help/{id}/restore',
  tags: ['Help'],
  summary: 'Restore an archived item',
  security: [{ bearerAuth: [] }],
  request: { params: helpItemIdParam },
  responses: {
    200: jsonResponse(z.object({ item: helpItemSchema }), 'Item restored.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

/* ------------------------------------------------------------------ */
/* Media (folder file uploads)                                         */
/* ------------------------------------------------------------------ */

/**
 * Upload is a three-step flow, because the bytes go straight from the browser
 * to object storage rather than through this API:
 *
 *   1. `POST /api/folders/{folderId}/media/presign` — describe the file, get a
 *      presigned PUT URL
 *   2. `PUT` the bytes to that URL, directly to S3
 *   3. `POST /api/folders/{folderId}/media` — record the asset
 *
 * Step 3 is separate because step 2 can fail silently: a dropped connection
 * looks the same as a success from the browser. Confirming afterwards is how the
 * database ends up reflecting only uploads that actually landed.
 */

const mediaAssetSchema = registry.register(
  'MediaAsset',
  z
    .object({
      id: z.uuid(),
      helpItemId: z.uuid().nullable().describe('Set when the asset is attached to a help item.'),
      folderId: z.uuid().nullable().describe('Set when the asset is filed directly in a folder.'),
      filename: z.string(),
      storageKey: z.string().describe('Object-storage key. Never a filesystem path.'),
      mimeType: z.string(),
      sizeBytes: z.number().int(),
      url: z.string().url().nullable().describe('Publicly readable URL. Null when the bucket is private.'),
      createdAt: z.string(),
    })
    .describe(
      'A stored file. Has at most one owner — a folder or a help item, never ' +
        'both. No owner means it lives in the `root` pseudo-folder.',
    ),
);

registry.registerPath({
  method: 'get',
  path: '/api/folders/{id}/media',
  tags: ['Media'],
  summary: 'List files in a folder',
  description:
    'Assets filed directly in this folder. Use `{id}` = `root` for files that ' +
    'belong to no folder.',
  security: [{ bearerAuth: [] }],
  request: { params: uploadTargetSchema },
  responses: {
    200: jsonResponse(z.object({ assets: z.array(mediaAssetSchema) }), 'Files in the folder.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/folders/{id}/media/presign',
  tags: ['Media'],
  summary: 'Request an upload URL (step 1 of 3)',
  description: [
    'Manager or superadmin. Returns a presigned `PUT` URL; upload the bytes to',
    'it directly, then confirm with `POST /api/folders/{id}/media`.',
    '',
    'The API never receives the file itself, which keeps memory flat regardless',
    'of file size.',
    '',
    `Allowed types: ${UPLOADABLE_MIME_TYPES.join(', ')}`,
    `Maximum size: ${MAX_UPLOAD_MB} MB.`,
    '',
    'Pass `helpItemId` to attach the file to a help item instead of the folder in',
    'the URL.',
  ].join('\n'),
  security: [{ bearerAuth: [] }],
  request: {
    params: uploadTargetSchema,
    body: { content: { 'application/json': { schema: presignUploadSchema } } },
  },
  responses: {
    200: jsonResponse(
      z.object({
        uploadUrl: z
          .string()
          .url()
          .describe('Presigned PUT target. Send the returned `headers` verbatim.'),
        headers: z
          .record(z.string(), z.string())
          .describe(
            'Headers that are part of the signature. Changing, dropping or adding ' +
              'any of them makes the PUT fail with 403.',
          ),
        storageKey: z.string().describe('Echo this back when confirming the upload.'),
        publicUrl: z.string().url().nullable().describe('Null if the bucket is private.'),
        expiresAt: z.string().describe('When the URL stops working.'),
      }),
      'Presigned URL issued.',
    ),
    400: { description: 'Unsupported file type or the file is too large.', content: { 'application/json': { schema: errorEnvelopeSchema } } },
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    422: validationErrorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/folders/{id}/media',
  tags: ['Media'],
  summary: 'Record a completed upload (step 3 of 3)',
  description:
    'Call after the bytes have been `PUT` to S3. The `storageKey` must be the one ' +
    'returned by the presign step and must belong to your tenant.',
  security: [{ bearerAuth: [] }],
  request: {
    params: uploadTargetSchema,
    body: { content: { 'application/json': { schema: confirmUploadSchema } } },
  },
  responses: {
    201: jsonResponse(z.object({ asset: mediaAssetSchema }), 'Asset recorded.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    422: validationErrorResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/help/{id}/media',
  tags: ['Media'],
  summary: 'List files attached to a help item',
  security: [{ bearerAuth: [] }],
  request: { params: helpItemIdParam },
  responses: {
    200: jsonResponse(z.object({ assets: z.array(mediaAssetSchema) }), 'Attached files.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/media/{id}',
  tags: ['Media'],
  summary: 'Remove a file record',
  description:
    'Manager or superadmin. Removes the database record only — the stored object is ' +
    'left for a bucket lifecycle rule to expire, so this request does not depend ' +
    'on S3 being reachable.',
  security: [{ bearerAuth: [] }],
  request: { params: assetIdParam },
  responses: {
    200: jsonResponse(z.object({ deleted: z.literal(true) }), 'Record removed.'),
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  },
});

/* ------------------------------------------------------------------ */
/* Document assembly                                                   */
/* ------------------------------------------------------------------ */

/**
 * Renders the registry as an OpenAPI 3.1 document.
 *
 * Built once and cached: the registry is static after module load, so every
 * request to /docs would otherwise redo identical work.
 */
let cachedDocument: ReturnType<OpenApiGeneratorV31['generateDocument']> | null = null;

export function buildOpenApiDocument(): ReturnType<OpenApiGeneratorV31['generateDocument']> {
  if (cachedDocument) return cachedDocument;

  const generator = new OpenApiGeneratorV31(registry.definitions);

  cachedDocument = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Help Management API',
      version: '1.0.0',
      description: [
        '# Help Management API',
        '',
        'Content and review workflow for the help-management system:',
        '**customer → manager → superadmin**.',
        '',
        '- **customer** reads published help for any screen or element',
        '- **manager** authors help content and submits it for review',
        '- **superadmin** approves or rejects with a reason; only then is it visible',
        '',
        '## Scope',
        '',
        'This document covers **help content and folders only**. Sign-in, account',
        'provisioning and service health are intentionally left out — see the API',
        'service documentation for those.',
        '',
        '## Authentication',
        '',
        'Every route here requires `Authorization: Bearer <token>`. Click **Auth** and',
        'paste a token, or set the `JWT` variable this document pre-fills for you.',
        '',
        'This service does not issue tokens. They are minted by the host system and',
        'verified here against the shared `JWT_SECRET`. A token carries the tenant it',
        'belongs to, so every read is scoped to that tenant.',
        '',
        '## Role permissions',
        '',
        '| Route | customer | manager | superadmin |',
        '| --- | --- | --- | --- |',
        '| `GET /api/help` | approved items only | all | all |',
        '| `GET /api/help/{id}/history` | — | author only | ✓ |',
        '| `POST /api/help` | — | ✓ | ✓ |',
        '| `PATCH /api/help/{id}` | — | author only | ✓ |',
        '| `POST /api/help/{id}/review` | — | — | ✓ |',
        '| `POST /api/help/{id}/resubmit` | — | author only | ✓ |',
        '| `GET /api/folders` | ✓ | ✓ | ✓ |',
        '| `POST /api/folders` | — | ✓ | ✓ |',
        '',
        '## Errors',
        '',
        'Every failure uses the same envelope with a machine-readable `code`:',
        '`BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404),',
        '`CONFLICT` (409), `UNPROCESSABLE` (422). Validation failures carry a `details`',
        'array naming each bad field.',
      ].join('\n'),
      license: { name: 'UNLICENSED' },
    },
    servers: [
      /**
       * Relative on purpose.
       *
       * A hardcoded host breaks the moment the port changes — which it did: this
       * list advertised :3000 while the service runs on :3100, so every "Send"
       * from the reference hit a dead port. `/` resolves to whatever origin
       * served the page, so the docs work on any port, through the Vite proxy,
       * and behind a gateway, with no configuration.
       */
      { url: '/', description: 'This server' },
    ],
    tags: [
      { name: 'Help', description: 'Help content and its review workflow.' },
      { name: 'Folders', description: 'The help folder tree.' },
      { name: 'Media', description: 'File uploads for folders and help items.' },
    ],
  });

  return cachedDocument;
}