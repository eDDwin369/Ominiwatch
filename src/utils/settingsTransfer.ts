/**
 * Settings export / import / reset for Account Settings.
 *
 * "Settings" = everything a user configures: Theme Studio (via its store), Global Settings
 * (`gs_*`, `headerConfig`, sidebar), and Account Settings preferences. Media (logos, images,
 * uploaded fonts) is never exported, and an import keeps the current media.
 * "Data" = profile, sessions, help content, reports, dashboard widgets, license, saved login:
 * kept by a settings reset, cleared by a factory reset.
 */
import { useThemeStore, DEFAULT_SETTINGS } from 'omnieye-theme-studio';

export const SETTINGS_FORMAT = 'omnieye-settings';
export const SETTINGS_VERSION = 1;

/** localStorage keys that hold settings (anything else is data or session state). */
const SETTINGS_KEY = /^(gs_.+|headerConfig|sidebarCollapsed|as_(language|timezone|analyticsCookies|marketingCookies))$/;

/** Theme Studio fields that carry media — never exported, never overwritten by an import. */
const THEME_MEDIA_FIELDS = ['logoUrl', 'loginImage', 'customFonts', 'customHeadFonts'];

const MAX_VALUE_LENGTH = 100_000;

const isMediaString = (v: unknown) => typeof v === 'string' && /^(data:|blob:)/.test(v.trim());

/** Recursively drops media strings (data:/blob: URLs) from a JSON value. */
function stripMedia(value: unknown): unknown {
  if (isMediaString(value)) return '';
  if (Array.isArray(value)) return value.map(stripMedia);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripMedia(v)]));
  }
  return value;
}

/** A stored value with media removed; null when the value itself is media (skip the key). */
function cleanStoredValue(raw: string): string | null {
  if (isMediaString(raw)) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? JSON.stringify(stripMedia(parsed)) : raw;
  } catch {
    return raw;
  }
}

function themeWithoutMedia(settings: Record<string, unknown>) {
  const out = { ...settings };
  for (const f of THEME_MEDIA_FIELDS) delete out[f];
  return stripMedia(out) as Record<string, unknown>;
}

function settingsKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && SETTINGS_KEY.test(k)) keys.push(k);
  }
  return keys.sort();
}

export interface SettingsFile {
  format: typeof SETTINGS_FORMAT;
  version: number;
  exportedAt: string;
  source: { app: string; host: string };
  theme: { settings: Record<string, unknown>; savedThemes: unknown[] };
  storage: Record<string, string>;
}

export function buildSettingsFile(): SettingsFile {
  const { settings, savedThemes } = useThemeStore.getState();
  const storage: Record<string, string> = {};
  for (const k of settingsKeys()) {
    const v = cleanStoredValue(localStorage.getItem(k) ?? '');
    if (v !== null) storage[k] = v;
  }
  return {
    format: SETTINGS_FORMAT,
    version: SETTINGS_VERSION,
    exportedAt: new Date().toISOString(),
    source: { app: 'OmniEye Base Application', host: window.location.host },
    theme: {
      settings: themeWithoutMedia(settings),
      savedThemes: (savedThemes ?? []).map((t: { snap?: Record<string, unknown> }) =>
        t && t.snap ? { ...t, snap: themeWithoutMedia(t.snap) } : t),
    },
    storage,
  };
}

/** Downloads the current settings as a JSON file; returns the file name. */
export function downloadSettingsFile(): string {
  const file = buildSettingsFile();
  const name = `omnieye-settings-${file.exportedAt.slice(0, 10)}.json`;
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return name;
}

export interface ImportPlan {
  file: SettingsFile;
  /** Theme Studio fields that will be applied (known fields with the right type, no media). */
  theme: Record<string, unknown>;
  savedThemes: unknown[];
  storage: Record<string, string>;
  skipped: number;
}

/**
 * Validates an uploaded settings file. Only known Theme Studio fields with the expected type
 * and whitelisted settings keys are accepted — a file can never write session, login or data
 * keys. Throws an Error with a user-facing message when the file is not usable.
 */
export function planImport(text: string): ImportPlan {
  let file: SettingsFile;
  try {
    file = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!file || file.format !== SETTINGS_FORMAT) {
    throw new Error('This is not an OmniEye settings file.');
  }
  if (typeof file.version !== 'number' || file.version > SETTINGS_VERSION) {
    throw new Error('This settings file was made by a newer version of the app.');
  }

  let skipped = 0;
  const defaults = DEFAULT_SETTINGS as Record<string, unknown>;
  const theme: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(file.theme?.settings ?? {})) {
    const known = k in defaults && !THEME_MEDIA_FIELDS.includes(k);
    const sameType = known && (Array.isArray(defaults[k]) ? Array.isArray(v) : typeof v === typeof defaults[k]);
    if (sameType) theme[k] = stripMedia(v);
    else skipped++;
  }

  const storage: Record<string, string> = {};
  for (const [k, v] of Object.entries(file.storage ?? {})) {
    if (SETTINGS_KEY.test(k) && typeof v === 'string' && v.length <= MAX_VALUE_LENGTH && !isMediaString(v)) {
      storage[k] = v;
    } else {
      skipped++;
    }
  }

  const savedThemes = Array.isArray(file.theme?.savedThemes) ? file.theme.savedThemes : [];
  if (!Object.keys(theme).length && !Object.keys(storage).length) {
    throw new Error('This file contains no settings that can be imported.');
  }
  return { file, theme, savedThemes, storage, skipped };
}

/** Applies a validated import. Current media is kept; the caller reloads the page. */
export function applyImport(plan: ImportPlan) {
  const state = useThemeStore.getState();
  const existingIds = new Set((state.savedThemes ?? []).map((t: { id?: string }) => t?.id));
  useThemeStore.setState({
    settings: { ...state.settings, ...plan.theme },
    savedThemes: [
      ...(state.savedThemes ?? []),
      ...plan.savedThemes.filter((t) => !existingIds.has((t as { id?: string })?.id)),
    ],
  });
  for (const [k, v] of Object.entries(plan.storage)) localStorage.setItem(k, v);
}

/** Settings back to the release defaults (Emerald); data is kept. The caller reloads the page. */
export function resetSettings() {
  for (const k of settingsKeys()) localStorage.removeItem(k);
  useThemeStore.getState().reset();
}

/** Everything back to a fresh install: all settings, data and the session. */
export function factoryReset() {
  localStorage.clear();
  sessionStorage.clear();
}
