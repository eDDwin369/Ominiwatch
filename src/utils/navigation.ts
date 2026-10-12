export type Screen = 'login' | 'forgot-password' | 'otp' | 'new-password' | 'success' | 'dashboard' | 'forgot-username';

/** Roles mirrored from the Help Management app, used to gate sidebar items. */
export type AppRole = 'admin' | 'sub_admin' | 'customer';

export interface AppRouteState {
  screen: Screen;
  view?: string;
  tab?: string;
  editMode?: boolean;
  themeStudioOpen?: boolean;
}

const AUTH_KEY = 'omnieye_auth_session';
const AUTH_EMAIL_KEY = 'omnieye_auth_email';
const AUTH_ROLE_KEY = 'omnieye_auth_role';
/** Set at login; the dashboard plays the "Welcome to OomniEye" intro once and clears it. */
export const INTRO_PENDING_KEY = 'omnieye_intro_pending';

/**
 * Check whether an active user session exists in sessionStorage.
 */
export function isAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Set or clear the active user session in sessionStorage.
 */
export function setSession(active: boolean, email?: string, role?: AppRole): void {
  try {
    if (active) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      if (email) {
        sessionStorage.setItem(AUTH_EMAIL_KEY, email);
      }
      if (role) {
        sessionStorage.setItem(AUTH_ROLE_KEY, role);
      }
    } else {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(AUTH_EMAIL_KEY);
      sessionStorage.removeItem(AUTH_ROLE_KEY);
    }
  } catch {
    // sessionStorage not available or quota exceeded
  }
}

/**
 * Retrieve the saved session email if available.
 */
export function getSessionEmail(): string {
  try {
    return sessionStorage.getItem(AUTH_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Retrieve the saved session role. Every login stores one; a missing or unknown value
 * falls back to the least-privileged role.
 */
export function getSessionRole(): AppRole {
  try {
    const role = sessionStorage.getItem(AUTH_ROLE_KEY);
    if (role === 'admin' || role === 'sub_admin' || role === 'customer') {
      return role;
    }
  } catch {
    // ignore
  }
  return 'customer';
}

/**
 * The only accounts that can sign in: the three Help Management roles.
 * Customer sees the app + right-click help; Help Admin creates help and sends it for approval;
 * Superadmin approves / rejects and controls which help is shown.
 * (Front-end only until the app has a real identity provider.)
 */
const LOGIN_ACCOUNTS: { email: string; password: string; role: AppRole }[] = [
  { email: 'customer@oomnieye.com', password: 'Customer@123', role: 'customer' },
  { email: 'subadmin@oomnieye.com', password: 'SubAdmin@123', role: 'sub_admin' },
  { email: 'admin@oomnieye.com', password: 'Admin@123', role: 'admin' },
];

/** The role for a valid email + password, or null when the credentials don't match an account. */
export function authenticate(email: string, password: string): AppRole | null {
  const account = LOGIN_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase());
  return account && account.password === password ? account.role : null;
}

/**
 * Parses the current window.location.hash and window.history.state into an AppRouteState.
 */
export function parseRouteFromUrl(): AppRouteState {
  // If window.history.state contains a valid screen, use it as baseline
  const histState = window.history.state as AppRouteState | null;

  const hash = window.location.hash || '';
  const cleanHash = hash.replace(/^#[!/]?/, '');
  const [pathPart, queryPart] = cleanHash.split('?');
  const query = new URLSearchParams(queryPart || '');
  const segments = (pathPart || '').split('/').filter(Boolean);

  const authed = isAuthenticated();

  if (segments[0] === 'dashboard') {
    return {
      screen: 'dashboard',
      view: segments[1] || histState?.view || 'overview',
      tab: query.get('tab') || histState?.tab || undefined,
      editMode: query.get('editMode') === 'true' || Boolean(histState?.editMode),
      themeStudioOpen: query.get('themeStudio') === 'true' || segments[1] === 'theme-studio' || Boolean(histState?.themeStudioOpen)
    };
  }

  const validAuthScreens: Screen[] = ['forgot-password', 'otp', 'new-password', 'success', 'forgot-username'];
  if (segments[0] && validAuthScreens.includes(segments[0] as Screen)) {
    return {
      screen: segments[0] as Screen
    };
  }

  if (segments[0] === 'login') {
    return {
      screen: 'login'
    };
  }

  // Fallback if no specific route is matched
  if (authed) {
    return {
      screen: 'dashboard',
      view: histState?.view || 'overview'
    };
  }

  return {
    screen: 'login'
  };
}

/**
 * Serializes an AppRouteState into a clean URL hash string.
 */
export function buildHashFromRoute(route: AppRouteState): string {
  if (route.screen === 'dashboard') {
    let hash = `#/dashboard/${route.view || 'overview'}`;
    const params = new URLSearchParams();
    if (route.tab) params.set('tab', route.tab);
    if (route.editMode) params.set('editMode', 'true');
    if (route.themeStudioOpen) params.set('themeStudio', 'true');
    const qs = params.toString();
    if (qs) hash += `?${qs}`;
    return hash;
  }
  return `#/${route.screen}`;
}

/**
 * Pushes a new state to the browser history and updates URL hash.
 */
export function pushAppRoute(route: AppRouteState): void {
  const newHash = buildHashFromRoute(route);
  if (window.location.hash !== newHash) {
    window.history.pushState(route, '', newHash);
  } else {
    window.history.replaceState(route, '', newHash);
  }
}

/**
 * Replaces the current state in the browser history and updates URL hash.
 */
export function replaceAppRoute(route: AppRouteState): void {
  const newHash = buildHashFromRoute(route);
  window.history.replaceState(route, '', newHash);
}

