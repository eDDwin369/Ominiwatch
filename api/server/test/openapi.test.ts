/**
 * The published API contract must stay internally consistent.
 *
 * These are not HTTP tests of the endpoints — they guard the generated document
 * itself, which is easy to break silently: a renamed schema leaves a dangling
 * `$ref` that renders as a broken example in the docs, and a path typo drops an
 * endpoint from the reference with nothing failing.
 */
import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument } from '../docs/openapi/registry.js';

const document = buildOpenApiDocument();
const paths = document.paths ?? {};

/** Every `#/components/schemas/...` reference, found anywhere in the tree. */
function collectRefs(node: unknown, found: string[] = []): string[] {
  if (!node || typeof node !== 'object') return found;
  if (!Array.isArray(node) && '$ref' in node && typeof node.$ref === 'string') {
    found.push(node.$ref);
  }
  for (const value of Object.values(node)) collectRefs(value, found);
  return found;
}

describe('generated OpenAPI document', () => {
  it('declares a valid OpenAPI 3.1 envelope', () => {
    expect(document.openapi).toBe('3.1.0');
    expect(document.info.title).toBe('Help Management API');
    expect(Array.isArray(document.servers) && document.servers.length).toBeTruthy();
  });

  it('resolves every $ref against declared components', () => {
    const declared = new Set(Object.keys(document.components?.schemas ?? {}));
    const dangling = collectRefs(document).filter((ref) => {
      const match = /^#\/components\/schemas\/(.+)$/.exec(ref);
      // Non-schema refs (securitySchemes, parameters) are resolved by the UI.
      if (!match) return false;
      return !declared.has(match[1]);
    });

    expect(dangling).toEqual([]);
  });

  it('documents the help and folder endpoints', () => {
    expect(paths['/api/help']).toBeDefined();
    expect(paths['/api/help/stats']).toBeDefined();
    expect(paths['/api/help/{id}']).toBeDefined();
    expect(paths['/api/help/{id}/review']).toBeDefined();
    expect(paths['/api/folders']).toBeDefined();
    expect(paths['/api/folders/{id}/contents']).toBeDefined();
  });

  it('excludes setup, auth and user-management routes', () => {
    // Scope decision: the reference covers help content and folders only. These
    // endpoints still exist in the app, they are simply not part of this
    // document — so this test guards the boundary, not the implementation.
    const outOfScope = Object.keys(paths).filter((path) =>
      /^\/api\/(setup|auth|users)\b/.test(path) || path === '/health',
    );
    expect(outOfScope).toEqual([]);
  });

  it('declares only the help, folders and media tags', () => {
    const declared = (document.tags ?? []).map((tag) => tag.name).sort();
    expect(declared).toEqual(['Folders', 'Help', 'Media']);
  });

  it('documents the folder upload flow', () => {
    // Uploads are three steps: presign, PUT straight to S3, then confirm.
    expect(paths['/api/folders/{id}/media']).toBeDefined();
    expect(paths['/api/folders/{id}/media/presign']).toBeDefined();
    expect(paths['/api/help/{id}/media']).toBeDefined();
  });

  it('requires a token on every documented media operation', () => {
    const mediaPaths = Object.entries(paths).filter(([path]) =>
      /^\/(api\/(folders|help)\/\{id\}\/media|api\/media\/\{id\})/.test(path),
    );
    expect(mediaPaths.length).toBeGreaterThan(0);

    for (const [path, operations] of mediaPaths) {
      for (const [method, operation] of Object.entries(operations as Record<string, unknown>)) {
        if (method === 'parameters') continue;
        const security = (operation as { security?: unknown }).security;
        expect(security, `${method.toUpperCase()} ${path} has no security requirement`).toBeTruthy();
      }
    }
  });

  it('offers a bearer security scheme', () => {
    expect(document.components?.securitySchemes?.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
  });

  it('records every tag it references so the sidebar groups correctly', () => {
    const used = new Set<string>();
    for (const operations of Object.values(paths)) {
      for (const operation of Object.values(operations as Record<string, unknown>)) {
        const tags = (operation as { tags?: string[] }).tags ?? [];
        tags.forEach((tag) => used.add(tag));
      }
    }

    const declared = new Set((document.tags ?? []).map((tag) => tag.name));
    const missing = [...used].filter((tag) => !declared.has(tag));

    expect(missing).toEqual([]);
  });
});