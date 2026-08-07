import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material';
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
  set('--highlight', tk.highlight);
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
    const w = settings[`h${n}Weight`] || settings.headingWeight || h.fontWeight;
    set(`--h${n}-weight`, w ? String(w) : undefined);
    set(`--h${n}-color`, settings[`h${n}Color`] || 'var(--text-main)');
  }
  set('--heading-lh', ty.h1?.lineHeight != null ? String(ty.h1.lineHeight) : undefined);
  // radius
  set('--radius-sm', `${theme.shape.borderRadius * 0.5}px`);
  set('--radius-md', `${theme.shape.borderRadius}px`);
  set('--radius-lg', `${theme.shape.borderRadius * 1.5}px`);
  set('--radius-xl', `${theme.shape.borderRadius * 2}px`);
  // flip the host's existing dark-var block to match the studio mode
  root.setAttribute('data-theme-mode', settings.mode);
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
