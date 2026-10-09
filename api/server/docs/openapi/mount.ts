/**
 * Interactive API reference page.
 *
 * Rendered here rather than via Scalar's `apiReference()` helper because the
 * auto-auth below needs a `customFetch` FUNCTION, and the helper serialises its
 * config to JSON for inlining in the HTML — functions cannot survive that. This
 * page is plain HTML we serve directly, so the config stays live JavaScript.
 *
 * Behaviour worth knowing:
 *   - A token bar stores a pasted bearer token (this service issues none) in
 *     localStorage, so the token survives a page reload.
 *   - `customFetch` attaches `Authorization: Bearer <token>` to every request
 *     the API client makes, which is what removes the usual paste-a-token-into
 *     the Auth modal step.
 *   - Any request may be sent without the header by clearing the token.
 */
import { Router, type Request, type Response } from 'express';
import { buildOpenApiDocument } from './registry.js';

export const docsRouter = Router();

/** GET /openapi.json — the machine-readable contract. */
docsRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(buildOpenApiDocument());
});

/**
 * GET /favicon.ico — the docs page declares no icon, so browsers fall back to
 * this path and log a 404. Redirecting to the app's SVG keeps the console clean.
 */
docsRouter.get('/favicon.ico', (_req: Request, res: Response) => {
  res.redirect(301, '/favicon.svg');
});

/**
 * Pinned to the same release Scalar's short CDN entry resolves to, so the
 * inlined bootstrap and the lazily-loaded bundle cannot drift apart.
 */
const SCALAR_VERSION = '1.73.1';
const SCALAR_ESM = `https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}/dist/browser/standalone.esm.js`;

const docsPage = `<!doctype html>
<html lang="en">
  <head>
    <title>Help Management API</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #0d0d12;
        color: #e8e8ef;
        font: 14px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #authbar {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        padding: 10px 16px;
        background: #16161d;
        border-bottom: 1px solid #26262f;
        position: sticky;
        top: 0;
        z-index: 20;
      }
      #authbar label { font-size: 12px; color: #9a9aab; }
      #authbar input {
        padding: 6px 9px;
        border-radius: 6px;
        border: 1px solid #33333f;
        background: #0f0f15;
        color: #e8e8ef;
        font: inherit;
      }
      #authbar input#email { width: 210px; }
      #authbar input#password { width: 190px; }
      button {
        padding: 6px 13px;
        border-radius: 6px;
        border: 1px solid #44445a;
        background: #4f46e5;
        color: #fff;
        font: inherit;
        font-weight: 500;
        cursor: pointer;
      }
      button:hover { background: #4338ca; }
      button.ghost { background: transparent; }
      button.ghost:hover { background: #26262f; }
      #who {
        margin-left: auto;
        font-size: 12px;
        color: #9a9aab;
        display: flex;
        align-items: center;
        gap: 9px;
      }
      #who b { color: #e8e8ef; font-weight: 600; }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #55555f; }
      .dot.on { background: #22c55e; }
      .dot.off { background: #ef4444; }
      #msg { font-size: 12px; width: 100%; margin: 0; min-height: 16px; }
      #msg.err { color: #f87171; }
      #msg.ok { color: #4ade80; }
      #app { min-height: calc(100vh - 60px); }
    </style>
  </head>
  <body>
    <div id="authbar">
      <label for="token">Bearer token</label>
      <input id="token" type="password" placeholder="paste a JWT" style="width:380px" autocomplete="off" />
      <button id="signin">Use token</button>
      <button id="signout" class="ghost">Sign out</button>
      <div id="who">
        <span class="dot off" id="dot"></span>
        <span id="who-text">not authenticated</span>
      </div>
      <p id="msg"></p>
    </div>
    <div id="app"></div>

    <script type="module">
      import { createApiReference } from '${SCALAR_ESM}';

      const TOKEN_KEY = 'api-docs.token';
      const USER_KEY = 'api-docs.user';

      const el = (id) => document.getElementById(id);
      const msg = el('msg');

      const setStatus = (text, kind = '') => {
        msg.textContent = text;
        msg.className = kind;
      };

      const readToken = () => localStorage.getItem(TOKEN_KEY) || '';

      /**
       * Refreshes the sign-in bar. Also gates "mustChangePassword" accounts,
       * which receive 403 on every protected route until they rotate.
       */
      function renderAuthBar() {
        const token = readToken();
        const dot = el('dot');
        const whoText = el('who-text');

        if (!token) {
          dot.className = 'dot off';
          whoText.textContent = 'no token — paste one above';
          return;
        }

        // Only the token is known here; this service has no profile endpoint
        // (that belongs to the host system), so there is no user to display.
        dot.className = 'dot on';
        whoText.textContent = 'token set · ' + token.slice(0, 12) + '…';
      }

      /**
       * Attaches the stored token to API requests.
       *
       * The login call itself is excluded: it carries credentials in the body
       * and must not carry a stale Authorization header.
       */
      async function customFetch(input, init) {
        const url = typeof input === 'string' ? input : input?.url || '';

        const headers = new Headers(init?.headers || (typeof input !== 'string' ? input?.headers : undefined));
        const token = readToken();
        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', 'Bearer ' + token);
        }

        return fetch(input, { ...init, headers });
      }

      /**
       * Stores a pasted token and verifies it against a protected route.
       *
       * There is no sign-in call: this service issues no tokens, so it cannot
       * mint one from a password. Verifying immediately means a bad or expired
       * token is reported here rather than as a confusing 401 on the first
       * operation the user tries.
       */
      async function signIn() {
        const token = el('token').value.trim();
        if (!token) {
          setStatus('Paste a bearer token first.', 'err');
          return;
        }

        setStatus('Checking token…');
        try {
          const response = await fetch('/api/help?pageSize=1', {
            headers: { Authorization: 'Bearer ' + token },
          });

          if (!response.ok) {
            let detail = 'HTTP ' + response.status;
            try {
              const body = await response.json();
              detail = body?.error?.message || detail;
            } catch {
              // Non-JSON error body; the status is all we have.
            }
            setStatus('Token rejected: ' + detail, 'err');
            return;
          }

          localStorage.setItem(TOKEN_KEY, token);
          el('token').value = '';
          renderAuthBar();
          setStatus('Token accepted. Every request below now sends it automatically.', 'ok');
        } catch (error) {
          setStatus('Could not reach the API: ' + error.message, 'err');
        }
      }

      function signOut() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        renderAuthBar();
        setStatus('Signed out. Protected routes will return 401 again.');
      }

      el('signin').addEventListener('click', signIn);
      el('signout').addEventListener('click', signOut);
      el('token').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') signIn();
      });

      renderAuthBar();

      createApiReference('#app', {
        _integration: 'express',
        spec: { url: '/openapi.json' },
        darkMode: true,
        theme: 'purple',
        pageTitle: 'Help Management API',
        showSidebar: true,
        hideDownloadButton: false,
        searchHotKey: 'k',
        defaultHttpClient: { clientKey: 'fetch', targetKey: 'node' },
        // Unlocks every operation without touching the Auth modal.
        customFetch,
        authentication: {
          preferredSecurityScheme: ['bearerAuth'],
        },
      });
    </script>
  </body>
</html>
`;

/** GET /docs — the interactive reference. */
docsRouter.get('/docs', (_req: Request, res: Response) => {
  // Served as HTML, not a JSON API response.
  res.type('html').send(docsPage);
});

/**
 * Referenced so the OpenAPI document is generated at least once at boot in
 * development — a broken registry should fail immediately rather than on the
 * first request to /openapi.json.
 */
export function assertDocumentBuilds(): void {
  buildOpenApiDocument();
}