/**
 * TanStack Router → host-app hash router bridge.
 *
 * The Help Management feature was built on TanStack Router. Instead of
 * rewriting every `useNavigate` / `useRouterState` call site, the base app
 * aliases `@tanstack/react-router` to this shim (see vite.config.ts and
 * tsconfig.app.json). It reads the host's `#/dashboard/<view>` hash and writes
 * to it, so help links and in-panel navigation stay in sync with the shell.
 */
import { useSyncExternalStore, type ReactNode } from 'react';

interface NavigateOptions {
  to?: string;
  replace?: boolean;
  search?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

interface RouterLocation {
  pathname: string;
  href: string;
  search: Record<string, unknown>;
  hash: string;
}

interface RouterState {
  location: RouterLocation;
}

/** Map a help-app route to the host app's `#/dashboard/<view>` route. */
function toHostHash(to: string): string {
  const clean = to.startsWith('/') ? to : `/${to}`;
  const view: Record<string, string> = {
    '/dashboard': 'overview',
    '/admin': 'admin',
    '/tickets': 'tickets',
    '/user': 'user',
    '/customer': 'customer',
  };
  const mapped = view[clean];
  if (clean === '/login') return '#/login';
  if (mapped) return `#/dashboard/${mapped}`;
  return `#/dashboard/${clean.replace(/^\//, '')}`;
}

function currentPath(): string {
  if (typeof window === 'undefined') return '/';
  const clean = (window.location.hash || '').replace(/^#!?/, '');
  const path = clean.split('?')[0];
  return path.startsWith('/') ? path : `/${path}`;
}

const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => listeners.forEach((l) => l()));
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useRouterState<T = RouterState>(
  opts?: { select?: (state: RouterState) => T },
): T {
  const pathname = useSyncExternalStore(subscribe, currentPath, () => '/');
  const state: RouterState = { location: { pathname, href: pathname, search: {}, hash: '' } };
  return opts?.select ? opts.select(state) : (state as unknown as T);
}

export function useNavigate() {
  return (opts: NavigateOptions | string) => {
    const to = typeof opts === 'string' ? opts : opts?.to ?? '/';
    if (typeof window !== 'undefined') {
      window.location.hash = toHostHash(to);
    }
  };
}

export function useRouter() {
  return { navigate: useNavigate(), invalidate: () => {} };
}

export function Link({
  to = '/',
  children,
  ...rest
}: { to?: string; children?: ReactNode } & Record<string, unknown>) {
  return (
    <a href={toHostHash(to)} {...rest}>
      {children}
    </a>
  );
}
