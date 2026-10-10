/**
 * Client for the help-management API (`api/`).
 *
 * The ONLY module in the app that talks to that service. Everything else imports
 * from here, so base URL, auth, and error handling live in one place.
 *
 * Two notes:
 *
 * 1. Requests go to `/api/...` on this origin. Vite proxies that to the API
 *    service (see `vite.spa.config.ts`), so the browser sees one origin and
 *    there is no CORS preflight in development.
 *
 * 2. The API returns 401 without a bearer token, and it does not issue tokens —
 *    that is the host system's job. Until the app's sign-in is wired to a real
 *    identity provider, a development token is supplied via
 *    `VITE_HELP_API_TOKEN`. This is a bridge, not the end state: see the README.
 */

/** Where the API service lives when running locally. */
const BASE = import.meta.env.VITE_HELP_API_URL ?? '';

/**
 * Development bearer token.
 *
 * Deliberately read from the environment rather than hardcoded, and it grants
 * whatever tenant it was minted for. Replace with a token from real sign-in.
 */
const TOKEN = import.meta.env.VITE_HELP_API_TOKEN ?? '';

export class HelpApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HelpApiError';
    this.status = status;
  }
  /** True when the token is missing, expired, or for the wrong tenant. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (TOKEN) headers.set('Authorization', `Bearer ${TOKEN}`);
  if (init.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${BASE}${path}`, { ...init, headers });

  if (response.status === 204) return null as T;

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message =
      (parsed as { error?: { message?: string } } | null)?.error?.message ??
      `Request failed (HTTP ${response.status})`;
    throw new HelpApiError(response.status, message);
  }

  return parsed as T;
}

/* ------------------------------------------------------------------ */
/* API shapes — mirror server/modules/help + folders + media           */
/* ------------------------------------------------------------------ */

export type ApiHelpStatus = 'pending' | 'approved' | 'rejected';

export type ApiHelpItem = {
  id: string;
  title: string;
  description: string;
  status: ApiHelpStatus;
  contentType: 'video' | 'image' | 'pdf' | 'text' | 'link';
  contentUrl: string | null;
  body?: string | null;
  contextKey?: string | null;
  relatedContext?: string | null;
  folderId: string | null;
  authorId: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiFolder = {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiMediaAsset = {
  id: string;
  helpItemId: string | null;
  folderId: string | null;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
  createdAt: string;
};

export type Paginated<T> = {
  items?: T[];
  users?: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

/* ------------------------------------------------------------------ */
/* Help content                                                        */
/* ------------------------------------------------------------------ */

/** GET /api/help — customers see approved items only; the server enforces it. */
export async function listHelpItems(
  params: { status?: ApiHelpStatus; contextKey?: string; folderId?: string; pageSize?: number } = {},
): Promise<ApiHelpItem[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const suffix = query.toString();
  const result = await request<{ items: ApiHelpItem[] }>(`/api/help${suffix ? `?${suffix}` : ''}`);
  return result.items;
}

/** GET /api/help/:id */
export async function getHelpItem(id: string): Promise<ApiHelpItem> {
  const result = await request<{ item: ApiHelpItem }>(`/api/help/${id}`);
  return result.item;
}

/** POST /api/help — manager or superadmin. Created as `pending`. */
export async function createHelpItem(input: {
  title: string;
  description?: string;
  contentType: 'video' | 'image' | 'pdf' | 'text' | 'link';
  contentUrl?: string;
  body?: string;
  contextKey?: string;
  relatedContext?: string;
  folderId?: string | null;
}): Promise<ApiHelpItem> {
  const result = await request<{ item: ApiHelpItem }>('/api/help', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.item;
}

/** POST /api/help/:id/review — superadmin only. `reason` is required to reject. */
export async function reviewHelpItem(
  id: string,
  decision: 'approved' | 'rejected',
  reason?: string,
): Promise<ApiHelpItem> {
  const result = await request<{ item: ApiHelpItem }>(`/api/help/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  });
  return result.item;
}

/** POST /api/help/:id/archive — soft delete. */
export async function archiveHelpItem(id: string): Promise<ApiHelpItem> {
  const result = await request<{ item: ApiHelpItem }>(`/api/help/${id}/archive`, { method: 'POST' });
  return result.item;
}

/** POST /api/help/:id/restore */
export async function restoreHelpItem(id: string): Promise<ApiHelpItem> {
  const result = await request<{ item: ApiHelpItem }>(`/api/help/${id}/restore`, { method: 'POST' });
  return result.item;
}

/** GET /api/help/stats */
export async function helpStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> {
  return request('/api/help/stats');
}

/* ------------------------------------------------------------------ */
/* Folders                                                             */
/* ------------------------------------------------------------------ */

/** GET /api/folders — the full nested tree. */
export async function listFolders(): Promise<ApiFolder[]> {
  const result = await request<{ folders: ApiFolder[] }>('/api/folders');
  return result.folders;
}

/** POST /api/folders — manager or superadmin. Omit `parentId` for the root. */
export async function createFolder(input: {
  name: string;
  parentId?: string | null;
  description?: string;
}): Promise<ApiFolder> {
  const result = await request<{ folder: ApiFolder }>('/api/folders', {
    method: 'POST',
    body: JSON.stringify({ description: '', ...input }),
  });
  return result.folder;
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

/** GET /api/folders/:id/media — use `root` for assets with no folder. */
export async function listFolderMedia(folderId: string): Promise<ApiMediaAsset[]> {
  const result = await request<{ assets: ApiMediaAsset[] }>(`/api/folders/${folderId}/media`);
  return result.assets;
}

/** Upload result from the presign step. */
export type PresignedUpload = {
  uploadUrl: string;
  headers: Record<string, string>;
  storageKey: string;
  publicUrl: string | null;
  expiresAt: string;
};

/**
 * Three-step upload.
 *
 *   1. presign — the API authorises and returns a signed PUT
 *   2. PUT the bytes straight to the bucket (never through our API)
 *   3. confirm — the API records the asset
 *
 * Step 3 is separate because the PUT can fail silently: a dropped connection
 * looks identical to success from the browser's side.
 */
export async function uploadFile(
  file: File,
  folderId: string = 'root',
): Promise<ApiMediaAsset> {
  const presigned = await request<PresignedUpload>(`/api/folders/${folderId}/media/presign`, {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  const put = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    // These are part of the signature; changing or dropping any of them 403s.
    headers: presigned.headers,
    body: file,
  });
  if (!put.ok) {
    throw new HelpApiError(put.status, `Upload failed (HTTP ${put.status})`);
  }

  const confirmed = await request<{ asset: ApiMediaAsset }>(`/api/folders/${folderId}/media`, {
    method: 'POST',
    body: JSON.stringify({ storageKey: presigned.storageKey, sizeBytes: file.size }),
  });
  return confirmed.asset;
}

/* ------------------------------------------------------------------ */
/* AI chat                                                             */
/* ------------------------------------------------------------------ */

export type ChatRole = 'system' | 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

/**
 * POST /api/chat — one conversational turn.
 *
 * Proxied through the API service rather than calling OpenRouter from here: the
 * OpenRouter key is a bearer credential, and anything the browser holds is
 * readable in devtools. The key never leaves the server.
 */
export async function askHelpChat(messages: ChatMessage[]): Promise<string> {
  const result = await request<{ reply: string; model: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
  return result.reply;
}

/* ------------------------------------------------------------------ */
/* Mapping to the app's own types                                      */
/* ------------------------------------------------------------------ */

/**
 * Maps an API help item onto the shape the HMS store already uses.
 *
 * Kept here rather than inside the store so the translation between the two
 * vocabularies lives in one place. Fields the API does not model — tags,
 * priority, hierarchy — fall back to sensible defaults, since the store's UI
 * predates this API.
 */
export function toArticleShape(
  item: ApiHelpItem,
  contextKeys: string[] = [],
): {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'image' | 'text';
  contentUrl: string | null;
  body: string | null;
  relatedContext: string;
  contexts: string[];
  approvalStatus: 'approved' | 'pending' | 'rejected';
  archiveStatus: 'active' | 'archived';
  authorId: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    // `link` has no direct equivalent; treat it as text so nothing is dropped.
    contentType: item.contentType === 'link' ? 'text' : item.contentType,
    contentUrl: item.contentUrl,
    body: item.body ?? null,
    relatedContext: item.relatedContext ?? '',
    contexts: item.contextKey ? [item.contextKey, ...contextKeys] : contextKeys,
    approvalStatus: item.status,
    archiveStatus: item.isArchived ? 'archived' : 'active',
    authorId: item.authorId,
    approvedBy: item.approvedBy,
    approvedAt: item.approvedAt,
    rejectionReason: item.rejectionReason,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * Help content and approvals are stored in localStorage only for now — no API
 * or database. Flip API_ENABLED to true (and set VITE_HELP_API_TOKEN) to
 * re-enable the API service path.
 */
const API_ENABLED = false;

/** Whether the client is configured at all, so the UI can explain itself. */
export const isHelpApiConfigured = API_ENABLED && Boolean(TOKEN);
