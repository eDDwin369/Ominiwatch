import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider, alpha } from '@mui/material';
import { useThemeStore, buildMuiTheme } from 'omnieye-theme-studio';

/**
 * Mirror the studio's resolved MUI theme onto the host's CSS variables. The host
 * chrome (sidebar/header/cards/login) is plain CSS, not MUI, so it only reflects
 * Theme Studio once these vars — defined in index.css / Dashboard.css — are
 * overwritten inline on :root (inline wins over the old [data-theme] presets).
 */
function syncCssVars(theme: any, settings: any) {
  const root = document.documentElement;
  const p = theme.palette;
  const set = (k: string, v?: string) => {
    if (v) root.style.setProperty(k, v);
  };
  // brand
  set('--primary', p.primary.main);
  set('--primary-hover', p.primary.dark);
  set('--primary-light', p.primary.light);
  set('--accent', p.primary.main);
  set('--accent-hover', p.primary.dark);
  // always-light foreground for text/icons sitting on an accent fill (primary/
  // success/warning/danger buttons) — stays readable in dark mode, unlike --bg-card.
  set('--on-accent', p.primary.contrastText);
  // surfaces + text + border
  set('--bg-dashboard', p.background.default);
  set('--bg-card', p.background.paper);
  set('--text-main', p.text.primary);
  set('--text-primary', p.text.primary);
  set('--text-secondary', p.text.secondary);
  set('--text-muted', p.text.disabled);
  set('--border-light', p.divider);
  set('--border-hover', p.divider);
  // status
  set('--success', p.success.main);
  set('--warning', p.warning.main);
  set('--danger', p.error.main);
  set('--info', p.info?.main);
  // secondary / highlight / card-header / notification-card / button color —
  // previously unmapped studio tokens, now emitted so host consumers can follow.
  set('--secondary', p.secondary?.main);
  set('--secondary-hover', p.secondary?.dark);
  const tk = theme.tokens || {};
  const isDark = settings.mode === 'dark';
  const highlight = settings.highlightHex || tk.highlight || p.primary.main || '#2563EB';
  const hlSoft = tk.highlightSoft && !tk.highlightSoft.includes('255, 212, 0')
    ? tk.highlightSoft
    : alpha(highlight, isDark ? 0.20 : 0.12);
  const hlBd = tk.highlightBd && !tk.highlightBd.includes('255, 212, 0')
    ? tk.highlightBd
    : alpha(highlight, isDark ? 0.50 : 0.35);

  set('--highlight', highlight);
  set('--highlight-soft', hlSoft);
  set('--highlight-bd', hlBd);
  set('--highlight-hover', alpha(highlight, 0.25));
  set('--card-hdr', tk.cardHdrBg);
  set('--notif-card', tk.toastBg);
  const btnBase = settings.btnColorHex || p.primary.main;
  set('--btn-color', settings.accentGradient ? `linear-gradient(135deg, ${btnBase}, ${p.primary.dark})` : btnBase);
  set('--btn-text', settings.btnTextHex || p.primary.contrastText);
  // shape / surface / density / misc tokens
  set('--card-border', tk.cardBodyBorder);
  set('--card-shadow', tk.cardBodyShadow);
  set('--card-hdr-accent', tk.cardHdrAccent);
  set('--card-hdr-border', tk.cardHdrBorder);
  set('--container-pad', tk.containerPad != null ? `${tk.containerPad}px` : undefined);
  set('--edge-pad', tk.edgePad != null ? `${tk.edgePad}px` : undefined);
  set('--card-gap', tk.cardGap != null ? `${tk.cardGap}px` : undefined);
  set('--btn-case', theme.typography.button?.textTransform);
  set('--status-weight', tk.statusBold ? '700' : '500');
  // chrome + login layout tokens
  set('--appbar-h', settings.appBarH > 0 ? `${settings.appBarH}px` : undefined);
  set('--login-card-w', settings.loginCardW > 0 ? `${settings.loginCardW}px` : undefined);
  set('--login-img-opacity', settings.loginImgOpacity > 0 ? String(settings.loginImgOpacity / 100) : undefined);
  set('--login-panel-color', settings.loginPanelColor || undefined);
  set('--login-image', settings.loginImage ? `url(${settings.loginImage})` : undefined);
  set('--notif-badge-display', settings.notifBadge === false ? 'none' : 'block');
  // typography — family + the full body type scale so studio size/weight/
  // line-height/spacing changes actually reach the host (index.css reads these).
  const body = theme.typography.body1 || {};
  set('--app-font-family', theme.typography.fontFamily);
  set('--app-heading-family', theme.typography.h1?.fontFamily || theme.typography.fontFamily);
  set('--app-font-size', body.fontSize ? `${body.fontSize}px` : undefined);
  set('--app-line-height', body.lineHeight != null ? String(body.lineHeight) : undefined);
  set('--app-font-weight', body.fontWeight != null ? String(body.fontWeight) : undefined);
  set('--app-letter-spacing', settings.letterSpace ? `${settings.letterSpace}px` : '0');
  // per-heading tokens: size comes from the resolved theme (already folds in
  // scaleRatio/textSize/baseFontPx/h{n}Size); weight/color from raw settings
  // (0/'' = auto → fall back to headingWeight / --text-main default in index.css).
  const ty = theme.typography;
  for (let n = 1; n <= 6; n++) {
    const h = ty[`h${n}`] || {};
    set(`--h${n}-size`, h.fontSize ? `${h.fontSize}px` : undefined);
    set(`--font-size-h${n}`, h.fontSize ? `${h.fontSize}px` : undefined);
    const w = settings[`h${n}Weight`] || settings.headingWeight || h.fontWeight;
    set(`--h${n}-weight`, w ? String(w) : undefined);
    set(`--h${n}-color`, settings[`h${n}Color`] || 'var(--text-main)');
  }
  set('--heading-lh', ty.h1?.lineHeight != null ? String(ty.h1.lineHeight) : undefined);
  // body typography tokens for Dashboard.css
  set('--font-size-body', ty.body1?.fontSize ? `${ty.body1.fontSize}px` : undefined);
  set('--font-size-body-sm', ty.body2?.fontSize ? `${ty.body2.fontSize}px` : undefined);
  set('--font-size-caption', ty.caption?.fontSize ? `${ty.caption.fontSize}px` : undefined);
  // mapped pixel sizes for component-specific tokens (e.g. --font-size-24, --font-size-14)
  const headingFontSizes = [ty.h1?.fontSize, ty.h2?.fontSize, ty.h3?.fontSize, ty.h4?.fontSize, ty.h5?.fontSize, ty.h6?.fontSize];
  const pixelSizes: Record<string, number | undefined> = {
    '24': headingFontSizes[0], // h1
    '20': headingFontSizes[1], // h2
    '18': 18,
    '17': headingFontSizes[2], // h3
    '14-5': 14.5,
    '14': headingFontSizes[3], // h4
    '13': 13,
    '12': 12,
    '11-5': 11.5,
    '11': 11,
  };
  Object.entries(pixelSizes).forEach(([key, val]) => {
    if (val) set(`--font-size-${key}`, `${val}px`);
  });
  // Dedicated Dashboard Ambient & Preset Tokens
  const primaryHex = settings.primaryHex || p.primary.main || '#2563EB';
  const secondaryHex = settings.secondaryHex || p.secondary?.main || '#00D2FF';
  const [pHue] = hexToHsl(primaryHex);
  const darkHeader = hslToHexStr(pHue, 38, 6.5);
  const darkSidebar = hslToHexStr(pHue, 35, 7.2);
  const darkCanvas = hslToHexStr(pHue, 32, 5.5);

  set('--dash-header-bg', darkHeader);
  set('--dash-sidebar-bg', settings.mode === 'dark' ? darkSidebar : '#ffffff');
  set('--dash-canvas-bg', settings.mode === 'dark' ? darkCanvas : '#ffffff');
  set('--dash-brand-gradient', `linear-gradient(90deg, ${primaryHex} 0%, ${secondaryHex} 100%)`);
  set('--dash-aura-color', primaryHex);
  set('--dash-active-pill-border', isDark ? highlight : hlBd);
  set('--dash-active-pill-bg', hlSoft);
  set('--dash-active-pill-color', highlight);

  // radius
  set('--radius-sm', `${theme.shape.borderRadius * 0.5}px`);
  set('--radius-md', `${theme.shape.borderRadius}px`);
  set('--radius-lg', `${theme.shape.borderRadius * 1.5}px`);
  set('--radius-xl', `${theme.shape.borderRadius * 2}px`);
  // flip the host's existing dark-var block to match the studio mode
  root.setAttribute('data-theme-mode', settings.mode);
}

function hexToHsl(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return [220, 50, 50];
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
  }
  return [h, Math.round(s * 100), Math.round(l * 100)];
}

function hslToHexStr(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Root theme provider for the host. Provides the studio's MUI theme (so embedded
 * URM + the studio itself inherit it) and syncs it to host CSS vars. buildMuiTheme
 * also injects the studio's Google-Font <link> as a side effect, so host + URM
 * fonts load here too.
 */
export function StudioTheme({ children }: { children: ReactNode }) {
  const settings = useThemeStore((s) => s.settings);
  const theme = useMemo(() => buildMuiTheme(settings), [settings]);
  useEffect(() => {
    syncCssVars(theme, settings);
  }, [theme, settings]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
