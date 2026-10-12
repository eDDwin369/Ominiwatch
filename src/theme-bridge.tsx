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
    if (v !== undefined && v !== null && v !== '') {
      root.style.setProperty(k, v);
    } else {
      root.style.removeProperty(k);
    }
  };
  // brand
  set('--primary', p.primary.main);
  set('--primary-hover', p.primary.dark);
  set('--primary-light', p.primary.light);
  set('--accent', p.primary.main);
  set('--accent-hover', p.primary.dark);
  set('--on-accent', p.primary.contrastText);
  const pageBg = settings.pageBgHex || p.background.default;
  set('--bg-dashboard', pageBg);
  set('--bg-card', p.background.paper);
  set('--page-bg', pageBg);
  set('--bg-base', pageBg);
  set('--text-main', p.text.primary);
  set('--text-primary', p.text.primary);
  set('--text-secondary', p.text.secondary);
  // muted text follows a custom secondary text colour when one is set
  set('--text-muted', settings.textSecondaryHex ? `color-mix(in srgb, ${settings.textSecondaryHex} 75%, transparent)` : p.text.disabled);
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
  set('--secondary-light', p.secondary?.light);
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
  const rawCardHdrBg = settings.cardHdrHex || tk.cardHdrBg;
  const cardHdrBg = (rawCardHdrBg && rawCardHdrBg !== 'transparent')
    ? (rawCardHdrBg.startsWith('rgba') ? `linear-gradient(${rawCardHdrBg}, ${rawCardHdrBg}), var(--bg-card)` : rawCardHdrBg)
    : 'var(--bg-card)';
  set('--card-hdr', cardHdrBg);
  // Colour-only parts of the card header for the shell's header band / field fill
  // (--card-hdr itself can be a background layer list, which color-mix() can't take).
  const hdrIsTint = !!rawCardHdrBg && rawCardHdrBg.startsWith('rgba');
  set('--card-hdr-base', settings.cardHdrHex || (rawCardHdrBg && rawCardHdrBg !== 'transparent' && !hdrIsTint ? rawCardHdrBg : undefined));
  set('--card-hdr-tint', hdrIsTint ? rawCardHdrBg : undefined);
  // Solid header band only for Tinted / Accent or a custom header colour; Plain leaves it unset
  // so the shell falls back to a soft fade into the card (no band edge).
  const solidHdr = settings.cardHeader !== 'plain' || !!settings.cardHdrHex;
  set('--card-hdr-solid-band', solidHdr
    ? 'linear-gradient(var(--card-hdr-tint, transparent), var(--card-hdr-tint, transparent)), color-mix(in srgb, var(--card-hdr-base, var(--bg-card)) 85%, transparent)'
    : undefined);
  // a solid band replaces the Plain top-of-card wash
  set('--card-hdr-wash', solidHdr ? 'linear-gradient(transparent, transparent)' : undefined);
  set('--notif-card', tk.toastBg);
  const btnBase = settings.btnColorHex || p.primary.main;
  set('--btn-color', settings.accentGradient ? `linear-gradient(135deg, ${btnBase}, ${p.primary.dark})` : btnBase);
  set('--btn-text', settings.btnTextHex || p.primary.contrastText);
  // shape / surface / density / misc tokens
  set('--card-border', tk.cardBodyBorder);
  set('--card-shadow', tk.cardBodyShadow);
  // shell cards that layer their own (stronger) shadow scale it by the studio's card shadow (20 = as designed)
  set('--card-shadow-scale', settings.cardShadowPx != null && settings.cardShadowPx >= 0 ? String(settings.cardShadowPx / 20) : undefined);
  set('--card-hdr-accent', tk.cardHdrAccent || 'none');
  set('--card-hdr-border', tk.cardHdrBorder === 'none' ? 'none' : (tk.cardHdrBorder || '1px solid var(--border-light)'));
  set('--container-pad', tk.containerPad != null ? `${tk.containerPad}px` : undefined);
  set('--edge-pad', tk.edgePad != null ? `${tk.edgePad}px` : undefined);
  set('--card-gap', tk.cardGap != null ? `${tk.cardGap}px` : undefined);
  set('--btn-case', theme.typography.button?.textTransform);
  // Table settings (raw studio settings — the theme carries no tokens for them); the shell's
  // list rows (Notifications) follow them: row dividers, row density, striped rows.
  set('--table-row-divider', settings.tableDividers ? `${settings.tableRowDivW || 1}px solid var(--border-light)` : 'none');
  set('--table-row-pad-scale', settings.tableDensity === 'compact' ? '0.7' : settings.tableDensity === 'comfortable' ? '1.3' : '1');
  set('--table-stripe', settings.tableStripe ? 'color-mix(in srgb, var(--text-main) 4%, transparent)' : 'transparent');
  set('--status-weight', tk.statusBold ? '700' : '500');

  // Card Alignment
  const cardAlign = (settings as any).cardAlign || 'left';
  set('--card-align', cardAlign);
  set('--card-header-align', cardAlign);
  set('--card-header-justify', cardAlign === 'center' ? 'center' : cardAlign === 'right' ? 'flex-end' : 'space-between');

  // Card Tint
  const tintHex = (settings as any).cardTintHex || '';
  const surfaceTint = (settings as any).surfaceTint || 'snow';
  let effectiveTintHex = tintHex;
  if (!effectiveTintHex && surfaceTint !== 'snow') {
    if (surfaceTint === 'brand') {
      effectiveTintHex = settings.primaryHex || '#4F6BFF';
    } else if (surfaceTint === 'neutral') {
      effectiveTintHex = isDark ? '#475569' : '#64748b';
    }
  }
  const rawIntensity = (settings as any).tintIntensity;
  const rawOpacity = (settings as any).tintOpacity;
  const effectiveOpacity = tintHex
    ? (rawOpacity != null && rawOpacity >= 0 ? rawOpacity : 15)
    : (rawIntensity != null && rawIntensity >= 0 ? rawIntensity : (rawOpacity != null && rawOpacity >= 0 ? rawOpacity : 20));

  set('--card-tint-color', effectiveTintHex || undefined);
  set('--card-tint-intensity', String(effectiveOpacity));
  set('--card-tint-opacity', `${effectiveOpacity}%`);
  if (effectiveTintHex && (surfaceTint !== 'snow' || tintHex) && effectiveOpacity > 0) {
    const baseBg = isDark ? '#1e293b' : '#ffffff';
    const tintBg = `color-mix(in srgb, ${effectiveTintHex} ${Math.round(effectiveOpacity)}%, ${baseBg})`;
    set('--card-tint-bg', tintBg);
    set('--bg-card', tintBg);
  } else {
    set('--card-tint-bg', undefined);
    set('--bg-card', p.background.paper);
  }

  // Nested Cards
  const nestedDepth = (settings as any).nestedDepth != null && (settings as any).nestedDepth >= 0 ? (settings as any).nestedDepth : 6;
  const nestedPad = (settings as any).nestedPad != null && (settings as any).nestedPad >= 0 ? (settings as any).nestedPad : 12;
  const nestedStyle = (settings as any).nestedStyle || 'recessed';
  set('--nested-pad', `${nestedPad}px`);
  set('--nested-depth', `${nestedDepth}px`);
  if (nestedStyle === 'bordered') {
    set('--nested-bg', isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)');
    set('--nested-border', isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.12)');
  } else if (nestedStyle === 'lighter') {
    set('--nested-bg', isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.7)');
    set('--nested-border', isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)');
  } else {
    // recessed
    set('--nested-bg', isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.04)');
    set('--nested-border', isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)');
  }
  set('--nested-shadow', nestedDepth > 0 ? `inset 0 ${Math.min(nestedDepth, 4)}px ${nestedDepth}px rgba(0,0,0,${isDark ? 0.2 : 0.06})` : 'none');

  // chrome + login layout tokens
  set('--appbar-h', settings.appBarH > 0 ? `${settings.appBarH}px` : undefined);
  set('--login-card-w', settings.loginCardW > 0 ? `${settings.loginCardW}px` : undefined);
  set('--login-img-opacity', settings.loginImgOpacity > 0 ? String(settings.loginImgOpacity / 100) : undefined);
  const defaultLoginPanel = isDark ? '#0f172a' : '#ffffff';
  set('--login-panel-color', settings.loginPanelColor || defaultLoginPanel);
  set('--login-image', settings.loginImage ? `url(${settings.loginImage})` : undefined);
  set('--notif-badge-display', settings.notifBadge === false ? 'none' : 'block');
  // Notification duration & positioning tokens
  const notifAutoDismiss = settings.notifAutoDismiss ?? false;
  const autoDismissSec = settings.autoDismissSec > 0 ? settings.autoDismissSec : 8;
  const autoDismissMs = notifAutoDismiss ? autoDismissSec * 1000 : 0;
  set('--notif-auto-dismiss', notifAutoDismiss ? '1' : '0');
  set('--notif-duration-sec', `${autoDismissSec}s`);
  set('--notif-duration', `${autoDismissMs}ms`);
  set('--notif-toast-width', settings.toastW > 0 ? `${settings.toastW}px` : '252px');

  const notifPos = settings.notifPosition || 'bottom-right';
  set('--notif-position', notifPos);
  if (notifPos === 'top-center') {
    set('--notif-pos-top', '70px');
    set('--notif-pos-bottom', 'auto');
    set('--notif-pos-left', '50%');
    set('--notif-pos-right', 'auto');
    set('--notif-pos-transform', 'translateX(-50%)');
  } else if (notifPos === 'top-right') {
    set('--notif-pos-top', '70px');
    set('--notif-pos-bottom', 'auto');
    set('--notif-pos-left', 'auto');
    set('--notif-pos-right', '24px');
    set('--notif-pos-transform', 'none');
  } else if (notifPos === 'bottom-left') {
    set('--notif-pos-top', 'auto');
    set('--notif-pos-bottom', '24px');
    set('--notif-pos-left', '24px');
    set('--notif-pos-right', 'auto');
    set('--notif-pos-transform', 'none');
  } else {
    // bottom-right
    set('--notif-pos-top', 'auto');
    set('--notif-pos-bottom', '24px');
    set('--notif-pos-left', 'auto');
    set('--notif-pos-right', '24px');
    set('--notif-pos-transform', 'none');
  }
  // typography — family + the full body type scale so studio size/weight/
  // line-height/spacing changes actually reach the host (index.css reads these).
  const body = theme.typography.body1 || {};
  set('--app-font-family', theme.typography.fontFamily);
  set('--app-heading-family', theme.typography.h1?.fontFamily || theme.typography.fontFamily);
  set('--app-font-size', body.fontSize ? `${body.fontSize}px` : undefined);
  set('--app-line-height', body.lineHeight != null ? String(body.lineHeight) : undefined);
  set('--app-font-weight', body.fontWeight != null ? String(body.fontWeight) : undefined);
  set('--app-letter-spacing', settings.letterSpace ? `${settings.letterSpace}px` : '0px');
  // per-heading tokens: size comes from raw settings.h{n}Size when set (presets pin
  // this explicitly), else the resolved theme (h1Size-derived fixed ratio); weight/color from raw settings
  // (0/'' = auto → fall back to headingWeight / --text-main default in index.css).
  const ty = theme.typography;
  for (let n = 1; n <= 6; n++) {
    const h = ty[`h${n}`] || {};
    const rawSize = h.fontSize || settings[`h${n}Size`];
    const formattedSize = rawSize ? (typeof rawSize === 'number' ? `${rawSize}px` : String(rawSize).endsWith('px') ? String(rawSize) : `${rawSize}px`) : undefined;
    set(`--h${n}-size`, formattedSize);
    set(`--font-size-h${n}`, formattedSize);
    const w = settings[`h${n}Weight`] || settings.headingWeight || h.fontWeight;
    set(`--h${n}-weight`, w ? String(w) : undefined);
    set(`--h${n}-color`, settings[`h${n}Color`] || 'var(--text-main)');
    // only when the user picked a heading colour — lets it replace the shell's gradient titles
    set(`--h${n}-color-custom`, settings[`h${n}Color`] || undefined);
  }
  set('--heading-lh', ty.h1?.lineHeight != null ? String(ty.h1.lineHeight) : undefined);
  // body typography tokens for Dashboard.css
  set('--font-size-body', ty.body1?.fontSize ? `${ty.body1.fontSize}px` : undefined);
  set('--font-size-body-sm', ty.body2?.fontSize ? `${ty.body2.fontSize}px` : undefined);
  set('--font-size-caption', ty.caption?.fontSize ? `${ty.caption.fontSize}px` : undefined);


  // Dedicated Dashboard Ambient & Preset Tokens
  const primaryHex = settings.primaryHex || p.primary.main || '#2563EB';
  const secondaryHex = settings.secondaryHex || p.secondary?.main || '#00D2FF';
  const [pHue] = hexToHsl(primaryHex);
  const darkSidebar = hslToHexStr(pHue, 35, 7.2);
  // Theme Studio's Login panel colour wins over the preset's own panel gradient
  set('--login-panel-color', settings.loginPanelColor || tk.loginPanelGradient);
  set('--dash-header-bg', tk.headerBg);
  // Sidebar bg/border — pinned per preset in dark mode (verified against
  // pixelPerfectNewReactCode for Emerald); other presets keep the primary-hue-derived bar.
  const figmaSidebarDark: Record<string, { bg: string; border: string }> = {
    corporate: { bg: '#090e24', border: '#1b2350' },
    'corporate-blue': { bg: '#090e24', border: '#1b2350' },
    emerald: { bg: '#061a12', border: '#163d2b' },
    indigo: { bg: '#120a2b', border: '#2c1e57' },
    'indigo-violet': { bg: '#120a2b', border: '#2c1e57' },
  };
  const sidebarPreset = isDark ? figmaSidebarDark[settings.presetId] : undefined;
  const darkSidebarBase = sidebarPreset?.bg || darkSidebar;

  // Subtle 10% gradient for sidebar matching the main background palette & direction (180deg vertical)
  const sidebarGradientLight = `linear-gradient(180deg, color-mix(in srgb, ${primaryHex} 8%, #ffffff) 0%, color-mix(in srgb, ${primaryHex} 3%, #ffffff) 45%, #ffffff 100%)`;
  const sidebarGradientDark = `linear-gradient(180deg, color-mix(in srgb, ${primaryHex} 10%, ${darkSidebarBase}) 0%, ${darkSidebarBase} 45%, color-mix(in srgb, #000000 30%, ${darkSidebarBase}) 100%)`;

  set('--dash-sidebar-bg-light', sidebarGradientLight);
  set('--dash-sidebar-bg-dark', sidebarGradientDark);
  set('--dash-sidebar-bg', isDark ? sidebarGradientDark : sidebarGradientLight);
  set('--dash-sidebar-border', sidebarPreset?.border || (isDark ? 'rgba(255, 255, 255, 0.08)' : '#dde2f0'));
  // Hero video-card fill — differs per colour template in Figma (not theme-neutral #080a09).
  const figmaVideoBg: Record<string, string> = {
    corporate: '#0b1024',
    'corporate-blue': '#0b1024',
    emerald: '#050505',
    // Verified against pprc_darkPink / pprc_lightPink (same in both modes).
    indigo: '#0b1024',
    'indigo-violet': '#0b1024',
  };
  set('--dash-video-bg', figmaVideoBg[settings.presetId] || '#080a09');
  // Sidebar nav text — Figma tints inactive-item text and section labels per colour template in
  // dark mode rather than using one flat neutral grey. Falls back to the existing neutral CSS
  // default for any preset not yet verified against a Figma export.
  const figmaNavText: Record<string, { inactive: string; sectionTitle: string }> = {
    corporate: { inactive: 'rgba(201, 208, 238, 0.8)', sectionTitle: 'rgba(138, 147, 189, 0.7)' },
    'corporate-blue': { inactive: 'rgba(201, 208, 238, 0.8)', sectionTitle: 'rgba(138, 147, 189, 0.7)' },
    indigo: { inactive: 'rgba(214, 199, 245, 0.8)', sectionTitle: 'rgba(156, 142, 196, 0.7)' },
    'indigo-violet': { inactive: 'rgba(214, 199, 245, 0.8)', sectionTitle: 'rgba(156, 142, 196, 0.7)' },
  };
  const navTextPreset = isDark ? figmaNavText[settings.presetId] : undefined;
  set('--dash-nav-inactive-color', navTextPreset?.inactive || (isDark ? '#94a3b8' : '#475569'));
  set('--dash-nav-section-color', navTextPreset?.sectionTitle || 'rgba(102, 112, 146, 0.7)');
  // CC/HD video badges — derived from primary/secondary by default (matches Corporate's Figma
  // export exactly); a preset can pin a literal override when its Figma badges deviate (Emerald).
  set('--dash-badge-cc', settings.ccBadge || `color-mix(in srgb, ${primaryHex} 90%, transparent)`);
  set('--dash-badge-hd', settings.hdBadge || secondaryHex);
  // Video progress bar fill — Corporate's Figma export uses raw primaryHex (not highlightHex,
  // despite highlightHex driving the sidebar's active-nav accent); Emerald's uses highlightHex.
  // Default to primaryHex; only presets confirmed to deviate get an explicit override.
  const figmaProgressFill: Record<string, string> = {
    emerald: highlight,
  };
  set('--dash-progress-fill', figmaProgressFill[settings.presetId] || primaryHex);
  set('--dash-canvas-bg', tk.canvasBg);
  set('--account-page-bg', settings.pageBgHex || tk.accountPageBg);
  const figmaAccountCardLight: Record<string, string> = {
    corporate: 'linear-gradient(90deg, #6CA4FF 0%, #C9D8F2 100%)',
    'corporate-blue': 'linear-gradient(90deg, #6CA4FF 0%, #C9D8F2 100%)',
    emerald: 'linear-gradient(90deg, #97E1B2 0%, #E6E6E6 100%)',
    indigo: 'linear-gradient(90deg, #FCB3D8 0%, #E6E6E6 100%)',
    'indigo-violet': 'linear-gradient(90deg, #FCB3D8 0%, #E6E6E6 100%)',
  };
  const figmaAccountCardDark: Record<string, string> = {
    corporate: 'linear-gradient(90deg, #010D27 0%, #03205F 100%)',
    'corporate-blue': 'linear-gradient(90deg, #010D27 0%, #03205F 100%)',
    emerald: 'linear-gradient(90deg, #001909 0%, #0A4821 100%)',
    indigo: 'linear-gradient(90deg, #010D27 0%, #37107A 100%)',
    'indigo-violet': 'linear-gradient(90deg, #010D27 0%, #37107A 100%)',
  };
  const resolvedAccountCardBg = isDark
    ? figmaAccountCardDark[settings.presetId] || tk.accountCardBg || 'linear-gradient(90deg, #010D27 0%, #03205F 100%)'
    : figmaAccountCardLight[settings.presetId] || tk.accountCardBg || 'linear-gradient(90deg, #6CA4FF 0%, #C9D8F2 100%)';
  // explicit card colour wins, then an active surface tint, else the preset's card gradient (release look)
  const activeTintBg = effectiveTintHex && (surfaceTint !== 'snow' || tintHex) && effectiveOpacity > 0
    ? `color-mix(in srgb, ${effectiveTintHex} ${Math.round(effectiveOpacity)}%, ${isDark ? '#1e293b' : '#ffffff'})`
    : '';
  set('--account-card-bg', settings.cardBgHex || activeTintBg || resolvedAccountCardBg);
  set('--dash-brand-gradient', tk.brandGradient);
  set('--dash-aura-color', primaryHex);
  set('--gs-accent-gradient', tk.gsAccentGradient);
  set('--gs-save-bg', secondaryHex);
  const figmaGsSaveShadow: Record<string, string> = {
    corporate: 'rgba(29, 78, 216, 0.6)',
  };
  set('--gs-save-shadow', figmaGsSaveShadow[settings.presetId] || `color-mix(in srgb, ${primaryHex} 60%, transparent)`);
  // H1-H6 / weight dropdown pills — were reading vars that were never defined anywhere
  // (rendered as bare browser <select> chrome). Neutral panel look, not preset-tinted.
  set('--gs-input-bg', isDark ? '#3c3f47' : '#ffffff');
  set('--gs-input-border', isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.15)');
  set('--gs-input-shadow', isDark ? 'none' : '0px 4px 4px rgba(0, 0, 0, 0.25)');
  set('--gs-text-color', isDark ? '#ffffff' : '#0f172a');
  // Config card fill — Figma-exact neutral panel (not the MUI paper --bg-card).
  set('--gs-card-bg-dark', '#141518');
  set('--gs-card-bg-light', '#f1f1f1');
  // Underline text-input border — pinned neutral per mode, not the generic MUI divider.
  set('--gs-underline-border', isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(80, 80, 80, 0.6)');
  set('--gs-modal-bg-dark', tk.gsModalBgDark);
  // Active eye-preview button — pinned border/shadow per preset; other presets fall back to
  // the existing --secondary-light / --accent-glow derived values.
  const figmaGsEyeActive: Record<string, { border: string; shadow: string }> = {
    corporate: { border: '#60a5fa', shadow: 'rgba(37, 99, 235, 0.8)' },
  };
  const eyeActivePreset = figmaGsEyeActive[settings.presetId];
  if (eyeActivePreset) {
    set('--gs-eye-active-border', eyeActivePreset.border);
    set('--gs-eye-active-shadow', eyeActivePreset.shadow);
  } else {
    root.style.removeProperty('--gs-eye-active-border');
    root.style.removeProperty('--gs-eye-active-shadow');
  }
  set('--gs-arrow-gradient', tk.gsArrowGradient);
  // Hero video-card ambient shadow — full CSS box-shadow value, explicit per-mode
  // preset value if set (Figma "Drop shadow" stack), else a primaryHex-derived glow.
  const videoShadow = isDark ? settings.videoShadowDark : settings.videoShadowLight;
  set(
    '--dash-video-shadow',
    videoShadow ||
      `0px 0px 33px ${isDark ? 0 : 14}px color-mix(in srgb, ${primaryHex} ${isDark ? 32 : 20}%, transparent)`
  );
  set('--dash-active-pill-border', isDark ? highlight : hlBd);
  set('--dash-active-pill-bg', hlSoft);
  set('--dash-active-pill-color', highlight);

  // Dynamic Card Shadow and Glow Tokens derived from active preset
  const cardGlow = isDark 
    ? `color-mix(in srgb, ${primaryHex} 20%, transparent)` 
    : `color-mix(in srgb, ${primaryHex} 12%, transparent)`;
  const dynamicCardShadow = tk.cardBodyShadow || (isDark 
    ? `0 16px 36px rgba(0, 0, 0, 0.45), 0 4px 20px ${cardGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.08)` 
    : `0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 10px ${cardGlow}`);

  set('--card-shadow', dynamicCardShadow);
  set('--card-shadow-glow', `0 8px 30px ${cardGlow}`);
  set('--accent-glow', isDark 
    ? `color-mix(in srgb, ${primaryHex} 45%, transparent)` 
    : `color-mix(in srgb, ${primaryHex} 25%, transparent)`);
  set('--secondary-glow', isDark 
    ? `color-mix(in srgb, ${secondaryHex} 45%, transparent)` 
    : `color-mix(in srgb, ${secondaryHex} 25%, transparent)`);

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
  const theme = useMemo(() => {
    const t = buildMuiTheme(settings);
    if (settings.pageBgHex && t.palette?.background) {
      t.palette.background.default = settings.pageBgHex;
    }
    if (t.components?.MuiCardHeader?.styleOverrides?.root) {
      const root = t.components.MuiCardHeader.styleOverrides.root as any;
      if (root.borderBottom === 'none') {
        root.borderBottom = '0px none';
      }
    }
    return t;
  }, [settings]);
  useEffect(() => {
    syncCssVars(theme, settings);
  }, [theme, settings]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
