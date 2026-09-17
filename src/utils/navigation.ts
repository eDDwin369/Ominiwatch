export type Screen = 'login' | 'forgot-password' | 'otp' | 'new-password' | 'success' | 'dashboard' | 'forgot-username';

export interface AppRouteState {
  screen: Screen;
  view?: string;
  tab?: string;
  editMode?: boolean;
  themeStudioOpen?: boolean;
}

const AUTH_KEY = 'omnieye_auth_session';
const AUTH_EMAIL_KEY = 'omnieye_auth_email';

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
export function setSession(active: boolean, email?: string): void {
  try {
    if (active) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      if (email) {
        sessionStorage.setItem(AUTH_EMAIL_KEY, email);
      }
    } else {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(AUTH_EMAIL_KEY);
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

