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

  // Exact Figma header chrome per colour template (Corporate Blue / Emerald / Indigo Violet),
  // per mode — verified against the Figma exports: Corporate + Indigo are the same flat/washed
  // bar in both modes, but Emerald's header is genuinely darker in dark mode (#0d2a20 light vs
  // #041610 dark). Any other preset falls back to the primary-hue-derived dark bar.
  const figmaHeaderBg: Record<string, { light: string; dark: string }> = {
    corporate: { light: '#141b3c', dark: '#141b3c' },
    emerald: { light: '#0d2a20', dark: '#041610' },
    // Verified against pprc_darkPink / pprc_lightPink — the header bar is the same
    // solid diagonal wash in both modes (not the dual-transparent overlay this
    // previously assumed).
    indigo: {
      light: 'linear-gradient(176.18088833734933deg, rgb(51, 34, 88) 16.741%, rgb(50, 20, 56) 83.447%)',
      dark: 'linear-gradient(176.18088833734933deg, rgb(51, 34, 88) 16.741%, rgb(50, 20, 56) 83.447%)',
    },
  };
  const headerPreset = figmaHeaderBg[settings.presetId];
  set('--dash-header-bg', headerPreset ? headerPreset[isDark ? 'dark' : 'light'] : darkHeader);
  // Sidebar bg/border — pinned per preset in dark mode (verified against
  // pixelPerfectNewReactCode for Emerald); other presets keep the primary-hue-derived bar.
  const figmaSidebarDark: Record<string, { bg: string; border: string }> = {
    corporate: { bg: '#090e24', border: '#1b2350' },
    emerald: { bg: '#061a12', border: '#163d2b' },
  };
  const sidebarPreset = isDark ? figmaSidebarDark[settings.presetId] : undefined;
  set('--dash-sidebar-bg', settings.mode === 'dark' ? sidebarPreset?.bg || darkSidebar : '#ffffff');
  set('--dash-sidebar-border', sidebarPreset?.border || (isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'));
  // Hero video-card fill — differs per colour template in Figma (not theme-neutral #080a09).
  const figmaVideoBg: Record<string, string> = {
    corporate: '#0b1024',
    emerald: '#050505',
    // Verified against pprc_darkPink / pprc_lightPink (same in both modes).
    indigo: '#0b1024',
  };
  set('--dash-video-bg', figmaVideoBg[settings.presetId] || '#080a09');
  // Sidebar nav text — Figma tints inactive-item text and section labels per colour template in
  // dark mode rather than using one flat neutral grey. Falls back to the existing neutral CSS
  // default for any preset not yet verified against a Figma export.
  const figmaNavText: Record<string, { inactive: string; sectionTitle: string }> = {
    corporate: { inactive: 'rgba(201, 208, 238, 0.8)', sectionTitle: 'rgba(138, 147, 189, 0.7)' },
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
  // Dashboard canvas (Container fill) — exact Figma vertical gradient per colour template in
  // dark mode; Emerald's light canvas is also a confirmed non-white tint (#ecf6f0), not plain
  // white. Any other preset/mode combo falls back to the primary-hue-derived flat dark / white.
  const figmaCanvasDark: Record<string, string> = {
    corporate: 'linear-gradient(180deg, #070A1B 0%, #111734 50%, #090D22 100%)',
    emerald: 'linear-gradient(180deg, #06140E 0%, #082318 50%, #061910 100%)',
    indigo: 'linear-gradient(180deg, #0D0620 0%, #221236 50%, #2E1F4F 100%)',
  };
  const figmaCanvasLight: Record<string, string> = {
    corporate: '#e1e6fb',
    emerald: '#ecf6f0',
    // Verified against pprc_lightPink: plain white, not a pale-lavender tint.
    indigo: '#ffffff',
  };
  set(
    '--dash-canvas-bg',
    settings.mode === 'dark'
      ? figmaCanvasDark[settings.presetId] || darkCanvas
      : figmaCanvasLight[settings.presetId] || '#ffffff'
  );
  // Account Settings card fill — Figma "tinted" card look, screenshot-verified per
  // preset (light: exact swatch hexes; dark: eyeballed from the dark-mode screenshots,
  // not swatch-exact). Other presets keep the flat --bg-card.
  const figmaAccountCardLight: Record<string, string> = {
    corporate: 'linear-gradient(90deg, #6CA4FF 0%, #C9D8F2 100%)',
    emerald: 'linear-gradient(90deg, #97E1B2 0%, #E6E6E6 100%)',
    indigo: 'linear-gradient(90deg, #FCB3D8 0%, #E6E6E6 100%)'
  };
  const figmaAccountCardDark: Record<string, string> = {
    corporate: 'linear-gradient(90deg, #010D27 0%, #03205F 100%)',
    emerald: 'linear-gradient(90deg, #06140e 0%, #0f3d2c 100%)',
    indigo: 'linear-gradient(90deg, #150a24 0%, #4b2e86 100%)',
  };
  set(
    '--account-card-bg',
    settings.mode === 'dark'
      ? figmaAccountCardDark[settings.presetId] || p.background.paper
      : figmaAccountCardLight[settings.presetId] || p.background.paper
  );
  // Hero "Brand" gradient text — Emerald's and Indigo's Figma stops differ from raw
  // primary/secondary in light mode.
  const figmaBrandGradient: Record<string, { light: string; dark: string }> = {
    corporate: {
      // Light mode's "Brand" gradient is a deep pinned navy, not derived from primary/secondary
      // (dark mode's stops happen to equal primaryHex/secondaryHex exactly).
      light: 'linear-gradient(90deg, #0029ff 0%, #00144b 100%)',
      dark: 'linear-gradient(90deg, #4f6bff 0%, #22d3ee 100%)',
    },
    emerald: {
      light: 'linear-gradient(90deg, #01b979 0%, #d88b00 100%)',
      dark: 'linear-gradient(90deg, #2ee6a6 0%, #ffc255 100%)',
    },
    // Verified against pprc_darkPink / pprc_lightPink: the "Brand" gradient text is
    // the SAME literal stops in both modes (previously assumed dark mode just used
    // raw primaryHex/secondaryHex — #a97bff/#ff5fa2 — which these exports disprove).
    indigo: {
      light: 'linear-gradient(90deg, #4300c1 0%, #ff388c 100%)',
      dark: 'linear-gradient(90deg, #4300c1 0%, #ff388c 100%)',
    },
  };
  const brandPreset = figmaBrandGradient[settings.presetId];
  set(
    '--dash-brand-gradient',
    brandPreset ? brandPreset[isDark ? 'dark' : 'light'] : `linear-gradient(90deg, ${primaryHex} 0%, ${secondaryHex} 100%)`
  );
  set('--dash-aura-color', primaryHex);
  // Global Settings panel chrome — verified against pixelPerfectGlobalSettings_blue (Corporate
  // dark). Other presets fall back to a primary/secondary-derived approximation until verified.
  const figmaGsHeaderDark: Record<string, string> = {
    corporate: 'linear-gradient(178deg, #0f172a 0%, #1e3a8a 100%)',
  };
  set(
    '--gs-header-bg-dark',
    figmaGsHeaderDark[settings.presetId] ||
      `linear-gradient(178deg, #0f172a 0%, color-mix(in srgb, ${primaryHex} 55%, #0f172a) 100%)`
  );
  // Toggle "on" state / upload-orb button — verified as genuinely different gradients per mode
  // (light: cyan-to-blue-violet; dark: cyan-to-dark-teal), not just a mode-neutral accent.
  const figmaGsAccentGradient: Record<string, { light: string; dark: string }> = {
    corporate: {
      light: 'linear-gradient(135deg, #00ddff 0%, #0c26b1 100%)',
      dark: 'linear-gradient(162deg, #22d3ee 11.886%, #126673 91.492%)',
    },
    // Dark verified against pixelPerfectGlobalSettings_greenDark (a flat 20% black wash
    // stacked over the amber gradient, not a plain 2-stop). Light not yet verified — kept
    // as the same secondary->primary formula the unpinned fallback below produces.
    emerald: {
      light: 'linear-gradient(135deg, #F5A524 0%, #10B981 100%)',
      dark: 'linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%), linear-gradient(180deg, #FFC255 0%, #997433 100%)',
    },
  };
  const gsAccentPreset = figmaGsAccentGradient[settings.presetId];
  set(
    '--gs-accent-gradient',
    gsAccentPreset
      ? gsAccentPreset[isDark ? 'dark' : 'light']
      : isDark
      ? `linear-gradient(162deg, ${secondaryHex} 11.886%, color-mix(in srgb, ${secondaryHex} 48%, black) 91.492%)`
      : `linear-gradient(135deg, ${secondaryHex} 0%, ${primaryHex} 100%)`
  );
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
  // Modal-wide radial glow (dark only) — Figma's real 6-stop falloff from primary to near-black,
  // replacing a flat 2-stop approximation. Light mode has no modal-wide gradient (verified).
  const figmaGsModalGradientDark: Record<string, string> = {
    corporate:
      'radial-gradient(circle at 50% 30%, #4f6bff 0%, #3f5adb 13.75%, #2e49b7 27.5%, #1e3892 41.25%, #0d276e 55%, #07153f 100%)',
    // Verified against pixelPerfectGlobalSettings_greenDark — centre stop is emerald's
    // highlightHex (#2EE6A6), not primaryHex, and it fades to a dark green (#072D20),
    // never pure black, unlike the unpinned fallback formula below.
    emerald:
      'radial-gradient(circle at 50% 30%, #2EE6A6 0%, #21AB7B 27.5%, #1A8D65 41.25%, #146F4F 55%, #0D4E37 77.5%, #072D20 100%)',
    // Verified against Figma's Indigo Violet dark-mode Global Settings gradient inspector
    // export: 3-stop radial, #A97BFF -> #4E22A0 -> #16013E (even spacing; exact Figma stop
    // offsets weren't available, matching corporate/emerald's precedent of pinning the real
    // colour sequence over guessing one).
    indigo: 'radial-gradient(circle at 50% 30%, #A97BFF 0%, #4E22A0 50%, #16013E 100%)',
  };
  // Same anchor idea as the Indigo entry above, generalised: mixing toward literal `black`
  // (even at a 10% primaryHex tint) still reads as a harsh black band on wide modals once a
  // preset has no verified export (graphite/teal/amber, or any custom colour edited in Theme
  // Studio — editing a colour snaps presetId to 'custom', see ColourPanel's setBrand, so this
  // fallback is actually the common path, not an edge case). Mix toward the app's own dark
  // chrome slate (#0f172a, matches --dash-canvas-bg's dark fallback) instead of black so the
  // edge blends with the surrounding UI rather than clipping to a visible black band.
  const gsModalDarkAnchor = '#0f172a';
  set(
    '--gs-modal-bg-dark',
    figmaGsModalGradientDark[settings.presetId] ||
      `radial-gradient(circle at 50% 30%, ${primaryHex} 0%, color-mix(in srgb, ${primaryHex} 78%, ${gsModalDarkAnchor}) 13.75%, color-mix(in srgb, ${primaryHex} 57%, ${gsModalDarkAnchor}) 27.5%, color-mix(in srgb, ${primaryHex} 36%, ${gsModalDarkAnchor}) 41.25%, color-mix(in srgb, ${primaryHex} 16%, ${gsModalDarkAnchor}) 55%, color-mix(in srgb, ${primaryHex} 20%, ${gsModalDarkAnchor}) 100%)`
  );
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
  // Target-callout pointer pill (the "Editing X" beam shown while highlighting a
  // section) — was plain CSS (primary-light -> primary-hover, unpinned) with no
  // verified value at all. Dark verified against pixelPerfectGlobalSettings_greenDark;
  // other presets fall back to the same primary.light -> primary.dark shape the old
  // CSS produced, so this is a no-op for them until verified.
  const figmaGsArrowGradient: Record<string, string> = {
    emerald: 'linear-gradient(169deg, #28C78F 0%, #18855F 100%)',
  };
  set(
    '--gs-arrow-gradient',
    figmaGsArrowGradient[settings.presetId] || `linear-gradient(135deg, ${p.primary.light} 0%, ${p.primary.dark} 100%)`
  );
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
  const theme = useMemo(() => buildMuiTheme(settings), [settings]);
  useEffect(() => {
    syncCssVars(theme, settings);
  }, [theme, settings]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
