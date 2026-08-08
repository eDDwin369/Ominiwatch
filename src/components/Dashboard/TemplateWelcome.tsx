import {
  CheckCircle2,
  HelpCircle,
  Hexagon,
  ArrowRight,
  BookOpen,
  Brush,
  Palette,
  Blocks,
  ShieldCheck,
  LayoutTemplate,
  Sliders,
  PaintBucket,
  Zap,
  Boxes,
  Lock
} from 'lucide-react';
import './Dashboard.css';

interface TemplateWelcomeProps {
  onNavigate?: (view: string) => void;
  onOpenSettings?: () => void;
}

// The project's documentation file (resolved to a served asset URL by Vite in
// both dev and build). "View Docs" opens it in a new tab.
const DOCS_URL = new URL('../../../README.md', import.meta.url).href;

/* --- Decorative illustrations -------------------------------------------------
   All artwork is drawn in `currentColor`, which each card sets to --on-accent.
   That keeps every illustration a "white-glass" motif that contrasts any accent
   colour AND recolours automatically when the Theme Studio palette changes —
   no hardcoded hues live here. */

const HeroArt = () => (
  <svg className="tw-hero-art" viewBox="0 0 340 220" fill="none" aria-hidden="true"
       style={{ color: 'var(--on-accent)' }}>
    {/* circuit traces */}
    <g stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M0 46 H108 L136 74 H250" strokeOpacity="0.14" />
      <path d="M0 104 H70 L100 134 H320" strokeOpacity="0.10" />
      <path d="M214 0 V54 L244 84 H340" strokeOpacity="0.14" />
      <path d="M40 160 H150 L176 134" strokeOpacity="0.08" />
    </g>
    <g fill="currentColor">
      <circle cx="108" cy="46" r="4" fillOpacity="0.22" />
      <circle cx="100" cy="134" r="4" fillOpacity="0.18" />
      <circle cx="244" cy="84" r="4" fillOpacity="0.22" />
    </g>
    {/* glowing shield */}
    <g transform="translate(196 26)">
      <path d="M62 6 L114 26 V74 C114 110 90 136 62 150 C34 136 10 110 10 74 V26 Z"
            fill="currentColor" fillOpacity="0.08"
            stroke="currentColor" strokeOpacity="0.55" strokeWidth="3" />
      <path d="M62 30 L92 42 V74 C92 98 80 116 62 126 C44 116 32 98 32 74 V42 Z"
            fill="currentColor" fillOpacity="0.06"
            stroke="currentColor" strokeOpacity="0.30" strokeWidth="2" />
      <path d="M62 30 V126 M32 62 L62 78 M92 62 L62 78 M32 92 L62 78 M92 92 L62 78"
            stroke="currentColor" strokeOpacity="0.28" strokeWidth="2" />
    </g>
  </svg>
);

const IllustBranding = () => (
  <svg className="tw-card-art" viewBox="0 0 140 140" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="tw-brand-card" x1="52" y1="34" x2="112" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" /><stop offset="1" stopColor="#e2e8f0" />
      </linearGradient>
      <linearGradient id="tw-brand-m" x1="64" y1="52" x2="96" y2="86" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ec4899" /><stop offset="0.5" stopColor="#a855f7" /><stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="tw-brand-wood" x1="35" y1="6" x2="49" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a1887f" /><stop offset="1" stopColor="#5d4037" />
      </linearGradient>
      <filter id="tw-shadow-a" x="-40%" y="-30%" width="180%" height="170%">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
      </filter>
    </defs>
    <g filter="url(#tw-shadow-a)">
      <rect x="52" y="34" width="60" height="66" rx="12" fill="url(#tw-brand-card)" />
      <path d="M66 84 V56 L79 72 L92 56 V84" fill="none" stroke="url(#tw-brand-m)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g filter="url(#tw-shadow-a)" transform="rotate(36 42 58)">
      <rect x="35" y="6" width="14" height="54" rx="7" fill="url(#tw-brand-wood)" />
      <rect x="34" y="58" width="16" height="15" fill="#b0bec5" />
      <rect x="34" y="65" width="16" height="8" fill="#90a4ae" />
      <path d="M35 73 h14 c3 15 -3 27 -7 27 c-4 0 -10 -12 -7 -27 z" fill="#db2777" />
      <path d="M42 100 c-3 6 -9 8 -13 5 c3 -6 7 -8 13 -5 z" fill="#f9a8d4" />
    </g>
  </svg>
);

const IllustTheme = () => (
  <svg className="tw-card-art" viewBox="0 0 140 140" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="tw-pal-white" x1="16" y1="24" x2="118" y2="120" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" /><stop offset="1" stopColor="#e2e8f0" />
      </linearGradient>
      <filter id="tw-shadow-b" x="-25%" y="-25%" width="160%" height="160%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#tw-shadow-b)">
      <path d="M70 24 C102 24 118 46 118 68 C118 84 106 90 94 90 C86 90 84 98 84 106 C84 116 76 120 66 120 C38 120 16 98 16 72 C16 46 40 24 70 24 Z" fill="url(#tw-pal-white)" />
      <ellipse cx="62" cy="98" rx="10" ry="8" fill="#0b3e63" opacity="0.22" />
      <circle cx="50" cy="48" r="8" fill="#ef4444" />
      <circle cx="78" cy="42" r="9" fill="#f59e0b" />
      <circle cx="100" cy="58" r="7" fill="#10b981" />
      <circle cx="102" cy="80" r="8" fill="#3b82f6" />
      <circle cx="78" cy="88" r="7" fill="#8b5cf6" />
      <circle cx="50" cy="74" r="6" fill="#ec4899" />
    </g>
    <g filter="url(#tw-shadow-b)" transform="translate(92,92)">
      <rect x="0" y="0" width="46" height="30" rx="6" fill="#1e293b" />
      <rect x="6" y="6" width="15" height="12" rx="3" fill="#0ea5e9" />
      <text x="13" y="16" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">A</text>
      <text x="26" y="21" fill="#f8fafc" fontSize="9" fontWeight="600" fontFamily="sans-serif">Font</text>
    </g>
  </svg>
);

const IllustContent = () => {
  const block = (dx: number, dy: number, top: string, left: string, right: string) => (
    <g transform={`translate(${dx} ${dy})`}>
      <path d="M0 16 L18 6 L36 16 L18 26 Z" fill={top} />
      <path d="M0 16 L18 26 L18 48 L0 38 Z" fill={left} />
      <path d="M36 16 L18 26 L18 48 L36 38 Z" fill={right} />
    </g>
  );
  return (
    <svg className="tw-card-art" viewBox="0 0 140 140" fill="none" aria-hidden="true">
      <defs>
        <filter id="tw-shadow-c" x="-25%" y="-25%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>
      <g filter="url(#tw-shadow-c)">
        <rect x="12" y="20" width="72" height="54" rx="8" fill="#ffffff" />
        <path d="M12 28 a8 8 0 0 1 8 -8 h56 a8 8 0 0 1 8 8 v2 H12 Z" fill="#e2e8f0" />
        <circle cx="20" cy="24" r="2" fill="#94a3b8" /><circle cx="28" cy="24" r="2" fill="#cbd5e1" />
        <rect x="20" y="40" width="26" height="20" rx="3" fill="#e2e8f0" />
        <rect x="52" y="40" width="22" height="7" rx="3" fill="#e2e8f0" />
        <rect x="52" y="52" width="22" height="7" rx="3" fill="#e2e8f0" />
      </g>
      <g filter="url(#tw-shadow-c)">
        {block(74, 44, '#ffffff', '#e2e8f0', '#cbd5e1')}
        {block(60, 66, '#7dd3fc', '#38bdf8', '#0284c7')}
        {block(88, 78, '#fdba74', '#f97316', '#c2410c')}
      </g>
    </svg>
  );
};

/* --- Main component ---------------------------------------------------------- */
export function TemplateWelcome({ onNavigate, onOpenSettings }: TemplateWelcomeProps) {
  const openThemeStudio = () => onNavigate?.('theme-studio');
  const openSettings = () => onOpenSettings?.();
  const openDocs = () => window.open(DOCS_URL, '_blank', 'noopener,noreferrer');

  return (
    <div className="template-welcome dashboard-fade-in">
      <div className="tw-bg-blob tw-blob-1"></div>
      <div className="tw-bg-blob tw-blob-2"></div>
      <div className="tw-bg-blob tw-blob-3"></div>
      <div className="tw-parent-card">

        {/* Hero + Getting Started cards overlap into one block */}
        <div className="tw-hero-block">
          <div className="tw-header">
            <HeroArt />
            <div className="tw-title-row">
              <span className="tw-brand-mark" aria-hidden="true"><Hexagon size={24} strokeWidth={2.5} /></span>
              <h2 className="tw-brand">MyProduct</h2>
              <div className="tw-badge">
                <CheckCircle2 size={14} />
                <span>Template Active</span>
              </div>
              <div className="tw-info-tooltip" title="OomniEye dashboard shell — configure branding, theming and content from the cards below.">
                <HelpCircle size={18} />
              </div>
            </div>
            <p className="tw-hero-subtitle">
              An enterprise dashboard shell with authentication, a configurable layout, and a
              token-driven theme engine — branding, theming and content, ready to ship.
            </p>
            <h3 className="tw-section-title tw-section-title--onhero">Getting started</h3>
          </div>

          <div className="tw-grid-3">
            {/* Card 1 — Branding via Global Settings */}
            <div className="tw-card tw-card--accent tw-accent-1">
              <span className="tw-card-illust" aria-hidden="true"><IllustBranding /></span>
              <div className="tw-card-header">
                <div className="tw-icon-wrapper"><Brush size={20} /></div>
                <h4>Configure Branding</h4>
              </div>
              <p>
                Set your product name, logo, header, footer and sidebar from the Global
                Settings workspace. Every change previews live and is saved to your browser.
              </p>
              <div className="tw-card-footer">
                <button type="button" className="tw-cta-btn" onClick={openSettings}>
                  Configure <ArrowRight size={14} />
                </button>
                <span className="tw-tag">Global Settings</span>
              </div>
            </div>

            {/* Card 2 — Theme Studio */}
            <div className="tw-card tw-card--accent tw-accent-2">
              <span className="tw-card-illust" aria-hidden="true"><IllustTheme /></span>
              <div className="tw-card-header">
                <div className="tw-icon-wrapper"><Palette size={20} /></div>
                <h4>Theme Studio</h4>
              </div>
              <p>
                Tune colours, typography, spacing, radius and elevation with live token
                editing across the brand themes, plus one-tap light and dark mode.
              </p>
              <div className="tw-card-footer">
                <button type="button" className="tw-cta-btn" onClick={openThemeStudio}>
                  Open Theme Studio <ArrowRight size={14} />
                </button>
                <span className="tw-tag">6 brand themes</span>
              </div>
            </div>

            {/* Card 3 — Build content / docs */}
            <div className="tw-card tw-card--accent tw-accent-3">
              <span className="tw-card-illust" aria-hidden="true"><IllustContent /></span>
              <div className="tw-card-header">
                <div className="tw-icon-wrapper"><Blocks size={20} /></div>
                <h4>Build Your Content</h4>
              </div>
              <p>
                Drop your own pages into the ready-made shell — header, sidebar, footer,
                routing and display-scaling are already wired. The setup guide walks you through it.
              </p>
              <div className="tw-card-footer">
                <button type="button" className="tw-cta-btn" onClick={openDocs}>
                  View Docs <BookOpen size={14} />
                </button>
                <span className="tw-tag">Setup guide</span>
              </div>
            </div>
          </div>
        </div>

        {/* What's already built */}
        <section className="tw-section tw-feature-box">
          <div className="tw-feature-header">
            <h3>What's already built</h3>
          </div>

          <div className="tw-grid-2">
            <div className="tw-feature-item tw-accent-1">
              <div className="tw-feature-icon-wrapper icon-gradient-1"><ShieldCheck size={20} /></div>
              <div>
                <h4>Authentication</h4>
                <ul className="tw-feature-list">
                  <li>Email &amp; password sign-in</li>
                  <li>5-step OTP password reset</li>
                  <li>Remember-me with API-ready hooks</li>
                </ul>
              </div>
            </div>
            <div className="tw-feature-item tw-accent-2">
              <div className="tw-feature-icon-wrapper icon-gradient-2"><LayoutTemplate size={20} /></div>
              <div>
                <h4>Layout Shell</h4>
                <ul className="tw-feature-list">
                  <li>Sticky header &amp; pinnable sidebar</li>
                  <li>Notification center &amp; profile menu</li>
                  <li>Auto display-scaling to fit any screen</li>
                </ul>
              </div>
            </div>
            <div className="tw-feature-item tw-accent-3">
              <div className="tw-feature-icon-wrapper icon-gradient-3"><Sliders size={20} /></div>
              <div>
                <h4>Settings System</h4>
                <ul className="tw-feature-list">
                  <li>Branding for header, footer &amp; sidebar</li>
                  <li>Customer profile &amp; logo</li>
                  <li>Live preview with local persistence</li>
                </ul>
              </div>
            </div>
            <div className="tw-feature-item tw-accent-4">
              <div className="tw-feature-icon-wrapper icon-gradient-4"><PaintBucket size={20} /></div>
              <div>
                <h4>Theme Engine</h4>
                <ul className="tw-feature-list">
                  <li>Multiple brand themes + light/dark</li>
                  <li>Token-driven colour &amp; typography</li>
                  <li>Spacing, radius &amp; elevation control</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Platform highlights — anchors the bottom of the page */}
        <section className="tw-section tw-highlights" aria-label="Platform highlights">
          <div className="tw-highlights-grid">
            <div className="tw-highlight">
              <div className="tw-highlight-icon icon-gradient-2"><Zap size={18} /></div>
              <div className="tw-highlight-text">
                <span className="tw-highlight-value">Production-ready</span>
                <span className="tw-highlight-label">React + TypeScript + Vite</span>
              </div>
            </div>
            <div className="tw-highlight">
              <div className="tw-highlight-icon icon-gradient-1"><Palette size={18} /></div>
              <div className="tw-highlight-text">
                <span className="tw-highlight-value">6 brand themes</span>
                <span className="tw-highlight-label">with light &amp; dark mode</span>
              </div>
            </div>
            <div className="tw-highlight">
              <div className="tw-highlight-icon icon-gradient-4"><Boxes size={18} /></div>
              <div className="tw-highlight-text">
                <span className="tw-highlight-value">Token-driven</span>
                <span className="tw-highlight-label">colour, type, spacing &amp; shape</span>
              </div>
            </div>
            <div className="tw-highlight">
              <div className="tw-highlight-icon icon-gradient-3"><Lock size={18} /></div>
              <div className="tw-highlight-text">
                <span className="tw-highlight-value">Secure by default</span>
                <span className="tw-highlight-label">login &amp; OTP reset flow</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
