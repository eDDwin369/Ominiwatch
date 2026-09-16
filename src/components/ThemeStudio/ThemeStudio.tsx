import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, RotateCcw, Upload, Download, Check, Sun, Moon,
  Palette, ChevronDown, Settings, ArrowUpFromLine
} from 'lucide-react';
import './ThemeStudio.css';
import './ThemeStudioAccordion.css';

interface ThemeStudioProps {
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

type ThemeName = 'corporate-blue' | 'emerald' | 'indigo-violet' | 'graphite' | 'ocean-teal' | 'amber';
type Mode = 'light' | 'dark';
type Screen = string;

const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'corporate-blue',  label: 'Corporate Blue' },
  { id: 'emerald',         label: 'Emerald' },
  { id: 'indigo-violet',   label: 'Indigo Violet' },
  { id: 'graphite',        label: 'Graphite' },
  { id: 'ocean-teal',      label: 'Ocean Teal' },
  { id: 'amber',           label: 'Amber' },
];

const SCREEN_GROUPS: { label: string; screens: Screen[] }[] = [
  { label: 'Auth', screens: ['Login', 'Form'] },
  { label: 'App', screens: ['Dashboard', 'Operations', 'Cameras', 'Reports', 'Orders'] },
  { label: 'Config', screens: ['Settings', 'Components'] },
];



export function ThemeStudio({ onClose, currentView, onNavigate }: ThemeStudioProps) {
  const [activeTheme, setActiveTheme] = useState<ThemeName>('amber');
  const [mode, setMode] = useState<Mode>('light');
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>('theme-mode');

  // Brand & Logo State
  const [appName, setAppName] = useState('Nexus ERP');
  const [tagline, setTagline] = useState('Run your whole business in one');
  const [logoType, setLogoType] = useState<'icon' | 'upload' | 'initials'>('initials');
  const [showBrandAdvanced, setShowBrandAdvanced] = useState(false);
  const [contrastText, setContrastText] = useState<'auto' | 'light' | 'dark'>('auto');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(50);

  // Typography State
  const [primaryFont, setPrimaryFont] = useState('Roboto');
  const [headingFont, setHeadingFont] = useState('Body');
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'default' | 'large'>('default');
  const [typeScale, setTypeScale] = useState<'compact' | 'default' | 'airy'>('default');
  const [showTypeAdvanced, setShowTypeAdvanced] = useState(false);
  const [uppercaseButtons, setUppercaseButtons] = useState(true);

  // Map dashboard route to screen name for the UI
  const getScreenFromView = (view: string) => {
    if (view === 'overview') return 'Dashboard';
    const mapping: Record<string, string> = {
      'operations': 'Operations',
      'cameras': 'Cameras',
      'reports': 'Reports',
      'orders': 'Orders',
      'settings': 'Settings',
      'components': 'Components',
      'login': 'Login',
      'form': 'Form'
    };
    return mapping[view] || 'Dashboard';
  };

  const activeScreen = getScreenFromView(currentView);

  const handleScreenSelect = (screen: Screen) => {
    let route = screen.toLowerCase();
    if (route === 'dashboard') route = 'overview';
    onNavigate(route);
  };

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleReset = () => {
    setActiveTheme('amber');
    setMode('light');
    onNavigate('overview');
  };

  // Apply theme to document globally for live preview
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.setAttribute('data-theme-mode', mode);
  }, [activeTheme, mode]);

  return (
    <>
      <div className="ts-panel" onClick={e => e.stopPropagation()}>

      {/* HEADER */}
        <div className="ts-header">
          <div className="ts-header-left">
            <div className="ts-logo-badge">
              <Palette size={16} color="#fff" />
            </div>
            <div className="ts-title-group">
              <span className="ts-title">ThemeKit Studio</span>
              <span className="ts-subtitle">{THEMES.find(t => t.id === activeTheme)?.label}</span>
            </div>
          </div>
          <button className="ts-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={14} />
          </button>
        </div>

        {/* ACTION BAR */}
        <div className="ts-action-bar">
          <button className="ts-action-btn reset" onClick={handleReset}>
            <RotateCcw size={12} /> RESET
          </button>
          <button className="ts-action-btn import">
            <Upload size={12} /> IMPORT
          </button>
          <button className="ts-action-btn export">
            <Download size={12} /> EXPORT
          </button>
        </div>

        {/* BODY */}
        <div className="ts-body">

          {/* ── PREVIEWING SCREEN ── */}
          <div className="ts-section">
              <div className="ts-section-header">
                <span className="ts-section-label">Previewing Screen</span>
                <span className="ts-section-meta">{activeScreen}</span>
              </div>
              {SCREEN_GROUPS.map(group => (
                <div key={group.label} className="ts-screen-group">
                  <div className="ts-screen-group-label">{group.label}</div>
                  <div className="ts-screen-grid">
                    {group.screens.map(screen => (
                      <button
                        key={screen}
                        className={`ts-screen-btn ${activeScreen === screen ? 'active' : ''}`}
                        onClick={() => handleScreenSelect(screen)}
                      >
                        {screen}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="ts-accordion-list">
              {/* Accordion 1: Theme & Mode */}
              <div className={`ts-accordion-item ${expandedAccordion === 'theme-mode' ? 'expanded' : ''}`}>
                <button 
                  className="ts-accordion-header" 
                  onClick={() => setExpandedAccordion(expandedAccordion === 'theme-mode' ? null : 'theme-mode')}
                >
                  <div className="ts-accordion-header-left">
                    <span className="ts-accordion-title">Theme & Mode</span>
                    <span className="ts-accordion-meta">{THEMES.find(t => t.id === activeTheme)?.label} · {mode === 'light' ? 'Light' : 'Dark'}</span>
                  </div>
                  <ChevronDown size={16} className="ts-accordion-icon" />
                </button>
                {expandedAccordion === 'theme-mode' && (
                  <div className="ts-accordion-content">
                    <div style={{ marginBottom: 'var(--spacing-3)' }}>
                      <div className="ts-screen-group-label" style={{ marginBottom: 'var(--spacing-2)' }}>Preset Themes</div>
                      <div className="ts-theme-grid">
                        {THEMES.map(theme => (
                          <button
                            key={theme.id}
                            data-theme={theme.id}
                            className={`ts-theme-pill ${activeTheme === theme.id ? 'active' : ''}`}
                            onClick={() => setActiveTheme(theme.id)}
                          >
                            <div className="ts-theme-swatch" />
                            <span className="ts-theme-name">{theme.label}</span>
                            {activeTheme === theme.id && (
                              <Check size={12} className="ts-theme-active-check" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="ts-screen-group-label" style={{ marginBottom: 'var(--spacing-2)' }}>Mode</div>
                      <div className="ts-mode-toggle">
                        <button
                          className={`ts-mode-btn ${mode === 'light' ? 'active' : ''}`}
                          onClick={() => setMode('light')}
                        >
                          <Sun size={14} /> Light
                        </button>
                        <button
                          className={`ts-mode-btn ${mode === 'dark' ? 'active' : ''}`}
                          onClick={() => setMode('dark')}
                        >
                          <Moon size={14} /> Dark
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Brand & Logo */}
              <div className={`ts-accordion-item ${expandedAccordion === 'brand-logo' ? 'expanded' : ''}`}>
                <button 
                  className="ts-accordion-header" 
                  onClick={() => setExpandedAccordion(expandedAccordion === 'brand-logo' ? null : 'brand-logo')}
                >
                  <div className="ts-accordion-header-left">
                    <span className="ts-accordion-title">Brand & Logo</span>
                    <span className="ts-accordion-meta">Nexus ERP</span>
                  </div>
                  <ChevronDown size={16} className="ts-accordion-icon" />
                </button>
                {expandedAccordion === 'brand-logo' && (
                  <div className="ts-accordion-content">
                    <div className="ts-form-group">
                      <label className="ts-form-label">APP NAME</label>
                      <input 
                        type="text" 
                        className="ts-input-field" 
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                      />
                    </div>
                    
                    <div className="ts-form-group">
                      <label className="ts-form-label">TAGLINE</label>
                      <input 
                        type="text" 
                        className="ts-input-field" 
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                      />
                    </div>
                    
                    <div className="ts-form-group">
                      <label className="ts-form-label">LOGO</label>
                      <div className="ts-segmented-control" style={{ marginBottom: '8px' }}>
                        <button 
                          className={`ts-segment-btn ${logoType === 'icon' ? 'active' : ''}`}
                          onClick={() => setLogoType('icon')}
                        >
                          Icon mark
                        </button>
                        <button 
                          className={`ts-segment-btn ${logoType === 'upload' ? 'active' : ''}`}
                          onClick={() => {
                            setLogoType('upload');
                            setIsCropperOpen(true);
                          }}
                        >
                          Upload image
                        </button>
                      </div>
                      
                      <button 
                        className={`ts-logo-tile ${logoType === 'initials' ? 'active' : ''}`}
                        onClick={() => setLogoType('initials')}
                      >
                        <div className="ts-logo-tile-icon">
                          {appName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ts-logo-tile-text">
                          <div className="ts-logo-tile-title">Auto initials</div>
                          <div className="ts-logo-tile-desc">Click the tile to set its color</div>
                        </div>
                      </button>
                    </div>

                    <div className="ts-form-group ts-flex-between">
                      <div>
                        <label className="ts-form-label">BRAND COLOR</label>
                        <div className="ts-wcag-badge">WCAG AA · 5.7:1</div>
                      </div>
                      <div className="ts-color-swatch-lg bg-primary"></div>
                    </div>

                    <button 
                      className="ts-advanced-toggle"
                      onClick={() => setShowBrandAdvanced(!showBrandAdvanced)}
                    >
                      {showBrandAdvanced ? '- Hide advanced' : <><Settings size={14} /> Advanced</>}
                    </button>

                    {showBrandAdvanced && (
                      <div className="ts-advanced-content">
                        <div className="ts-form-group">
                          <label className="ts-form-label">SECONDARY / ACCENT</label>
                          <div className="ts-color-row">
                            <div className="ts-color-swatch-lg bg-emerald" style={{ width: '100%', height: '36px' }}></div>
                          </div>
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-form-label">PRIMARY LIGHT / DARK (AUTO IF UNSET)</label>
                          <div className="ts-color-row">
                            <div className="ts-color-column">
                              <div className="ts-color-swatch-lg bg-primary-light" style={{ width: '100%', height: '36px' }}></div>
                              <span className="ts-color-label">Light</span>
                            </div>
                            <div className="ts-color-column">
                              <div className="ts-color-swatch-lg bg-primary-dark" style={{ width: '100%', height: '36px' }}></div>
                              <span className="ts-color-label">Dark</span>
                            </div>
                          </div>
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-form-label">CONTRAST TEXT ON PRIMARY</label>
                          <div className="ts-segmented-control">
                            <button 
                              className={`ts-segment-btn ${contrastText === 'auto' ? 'active' : ''}`}
                              onClick={() => setContrastText('auto')}
                            >Auto</button>
                            <button 
                              className={`ts-segment-btn ${contrastText === 'light' ? 'active' : ''}`}
                              onClick={() => setContrastText('light')}
                            >Light</button>
                            <button 
                              className={`ts-segment-btn ${contrastText === 'dark' ? 'active' : ''}`}
                              onClick={() => setContrastText('dark')}
                            >Dark</button>
                          </div>
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-form-label">STATUS COLORS</label>
                          <div className="ts-status-colors-grid">
                            <div className="ts-color-column">
                              <div className="ts-color-swatch-lg" style={{ background: '#34A853' }}></div>
                              <span className="ts-color-label">Success</span>
                            </div>
                            <div className="ts-color-column">
                              <div className="ts-color-swatch-lg" style={{ background: '#F57C00' }}></div>
                              <span className="ts-color-label">Warning</span>
                            </div>
                            <div className="ts-color-column">
                              <div className="ts-color-swatch-lg" style={{ background: '#0288D1' }}></div>
                              <span className="ts-color-label">Info</span>
                            </div>
                            <div className="ts-color-column">
                              <div className="ts-color-swatch-lg" style={{ background: '#D32F2F' }}></div>
                              <span className="ts-color-label">Error</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 3: Typography */}
              <div className={`ts-accordion-item ${expandedAccordion === 'typography' ? 'expanded' : ''}`}>
                <button 
                  className="ts-accordion-header" 
                  onClick={() => setExpandedAccordion(expandedAccordion === 'typography' ? null : 'typography')}
                >
                  <div className="ts-accordion-header-left">
                    <span className="ts-accordion-title">Typography</span>
                    <span className="ts-accordion-meta">Roboto · Default</span>
                  </div>
                  <ChevronDown size={16} className="ts-accordion-icon" />
                </button>
                {expandedAccordion === 'typography' && (
                  <div className="ts-accordion-content">
                    <div className="ts-form-group">
                      <label className="ts-form-label">FONT FAMILY</label>
                      <div className="ts-font-grid">
                        {['Roboto', 'Public Sans', 'IBM Plex', 'Manrope', 'Lexend', 'Nunito Sans'].map(font => (
                          <button 
                            key={font}
                            className={`ts-font-btn ${primaryFont === font ? 'active' : ''}`}
                            onClick={() => setPrimaryFont(font)}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                      
                      <div className="ts-upload-box">
                        <ArrowUpFromLine size={16} />
                        <div className="ts-upload-text">Upload custom font</div>
                        <div className="ts-upload-meta">.woff2 / .ttf / .otf</div>
                      </div>
                    </div>

                    <div className="ts-form-group">
                      <label className="ts-form-label">TEXT SIZE</label>
                      <div className="ts-segmented-control">
                        {['Small', 'Medium', 'Default', 'Large'].map(size => (
                          <button 
                            key={size}
                            className={`ts-segment-btn ${textSize === size.toLowerCase() ? 'active' : ''}`}
                            onClick={() => setTextSize(size.toLowerCase() as any)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ts-form-group">
                      <label className="ts-form-label">TYPE SCALE</label>
                      <div className="ts-segmented-control">
                        {['Compact', 'Default', 'Airy'].map(scale => (
                          <button 
                            key={scale}
                            className={`ts-segment-btn ${typeScale === scale.toLowerCase() ? 'active' : ''}`}
                            onClick={() => setTypeScale(scale.toLowerCase() as any)}
                          >
                            {scale}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      className="ts-advanced-toggle"
                      onClick={() => setShowTypeAdvanced(!showTypeAdvanced)}
                    >
                      {showTypeAdvanced ? '- Hide advanced' : <><Settings size={14} /> Advanced</>}
                    </button>

                    {showTypeAdvanced && (
                      <div className="ts-advanced-content">
                        <div className="ts-form-group">
                          <label className="ts-form-label">HEADING FONT</label>
                          <div className="ts-font-grid">
                            {['Body', 'Roboto', 'Public Sans', 'IBM Plex', 'Manrope', 'Lexend', 'Nunito Sans'].map(font => (
                              <button 
                                key={font}
                                className={`ts-font-btn ${headingFont === font ? 'active' : ''}`}
                                onClick={() => setHeadingFont(font)}
                              >
                                {font}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-slider-label">Heading weight: 700</label>
                          <input type="range" className="ts-slider" min="400" max="900" step="100" defaultValue="700" />
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-slider-label">BASE FONT SIZE: AUTO</label>
                          <input type="range" className="ts-slider" min="12" max="18" defaultValue="14" />
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-slider-label">BODY LINE HEIGHT: AUTO</label>
                          <input type="range" className="ts-slider" min="1.2" max="2.0" step="0.1" defaultValue="1.5" />
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-slider-label">H1 · PAGE TITLE — SIZE AUTO · WEIGHT AUTO</label>
                          <input type="range" className="ts-slider" style={{ marginBottom: '8px' }} />
                          <input type="range" className="ts-slider" />
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-slider-label">H2 · STAT / METRIC — SIZE AUTO · WEIGHT AUTO</label>
                          <input type="range" className="ts-slider" style={{ marginBottom: '8px' }} />
                          <input type="range" className="ts-slider" />
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-slider-label">H3 · CARD TITLE — SIZE AUTO · WEIGHT AUTO</label>
                          <input type="range" className="ts-slider" style={{ marginBottom: '8px' }} />
                          <input type="range" className="ts-slider" />
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-form-label">HEADING TEXT COLORS</label>
                          <div className="ts-color-list">
                            <div className="ts-color-list-item">
                              <div className="ts-color-swatch-sm" style={{ background: '#1e293b' }}></div>
                              <span>H1 · Page Title</span>
                            </div>
                            <div className="ts-color-list-item">
                              <div className="ts-color-swatch-sm" style={{ background: '#1e293b' }}></div>
                              <span>H2 · Stat / Metric</span>
                            </div>
                            <div className="ts-color-list-item">
                              <div className="ts-color-swatch-sm" style={{ background: '#1e293b' }}></div>
                              <span>H3 · Card Title</span>
                            </div>
                          </div>
                        </div>

                        <div className="ts-form-group">
                          <label className="ts-form-label">BODY TEXT COLORS</label>
                          <div className="ts-color-list">
                            <div className="ts-color-list-item">
                              <div className="ts-color-swatch-sm" style={{ background: '#1e293b' }}></div>
                              <span>Primary Text</span>
                            </div>
                            <div className="ts-color-list-item">
                              <div className="ts-color-swatch-sm" style={{ background: '#64748b' }}></div>
                              <span>Secondary Text</span>
                            </div>
                            <div className="ts-color-list-item">
                              <div className="ts-color-swatch-sm" style={{ background: 'var(--border-light)', border: '1px solid #cbd5e1' }}></div>
                              <span>Divider</span>
                            </div>
                          </div>
                        </div>

                        <div className="ts-form-group ts-flex-between" style={{ marginTop: '24px' }}>
                          <label className="ts-form-label" style={{ marginBottom: 0 }}>Uppercase buttons</label>
                          <div className={`ts-toggle ${uppercaseButtons ? 'active' : ''}`} onClick={() => setUppercaseButtons(!uppercaseButtons)}>
                            <div className="ts-toggle-thumb"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 4: Surface, Cards & Shape */}
              <div className={`ts-accordion-item ${expandedAccordion === 'surface' ? 'expanded' : ''}`}>
                <button 
                  className="ts-accordion-header" 
                  onClick={() => setExpandedAccordion(expandedAccordion === 'surface' ? null : 'surface')}
                >
                  <div className="ts-accordion-header-left">
                    <span className="ts-accordion-title">Surface, Cards & Shape</span>
                    <span className="ts-accordion-meta">Rounded · Default</span>
                  </div>
                  <ChevronDown size={16} className="ts-accordion-icon" />
                </button>
              </div>

              {/* Accordion 5: Notifications */}
              <div className={`ts-accordion-item ${expandedAccordion === 'notifications' ? 'expanded' : ''}`}>
                <button 
                  className="ts-accordion-header" 
                  onClick={() => setExpandedAccordion(expandedAccordion === 'notifications' ? null : 'notifications')}
                >
                  <div className="ts-accordion-header-left">
                    <span className="ts-accordion-title">Notifications</span>
                    <span className="ts-accordion-meta">Top Right · toast</span>
                  </div>
                  <ChevronDown size={16} className="ts-accordion-icon" />
                </button>
              </div>

              {/* Accordion 6: Login Screen */}
              <div className={`ts-accordion-item ${expandedAccordion === 'login' ? 'expanded' : ''}`}>
                <button 
                  className="ts-accordion-header" 
                  onClick={() => setExpandedAccordion(expandedAccordion === 'login' ? null : 'login')}
                >
                  <div className="ts-accordion-header-left">
                    <span className="ts-accordion-title">Login Screen</span>
                    <span className="ts-accordion-meta">Split Brand</span>
                  </div>
                  <ChevronDown size={16} className="ts-accordion-icon" />
                </button>
              </div>

            </div>

        </div>

        {/* FOOTER */}
        <div className="ts-footer">
          <button className="ts-done-btn" style={{ backgroundColor: '#2b3944', padding: '14px' }} onClick={onClose}>
            <Check size={16} /> DONE — BACK TO APP
          </button>
        </div>

      </div>

      {/* CROPPER MODAL */}
      {isCropperOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '400px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Adjust brand image</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                Drag and zoom to fit your signature inside the bright frame. Anything in the dimmed area is cropped out and will not appear on the login screen.
              </p>
            </div>

            {/* Cropper Area */}
            <div style={{
              width: '100%',
              height: '220px',
              backgroundColor: '#475569',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Dummy Image */}
              <div style={{
                width: '180px',
                height: '100%',
                backgroundColor: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'repeating-linear-gradient(45deg, #334155 25%, transparent 25%, transparent 75%, #334155 75%, #334155), repeating-linear-gradient(45deg, #334155 25%, #1e293b 25%, #1e293b 75%, #334155 75%, #334155)',
                backgroundPosition: '0 0, 10px 10px',
                backgroundSize: '20px 20px',
                transform: `scale(${zoomLevel / 50})`,
                transition: 'transform 0.05s ease-out'
              }}>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>IMAGE</span>
              </div>
              
              {/* Dimmed Area overlay (bright frame cutout) */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '240px',
                height: '140px',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none'
              }} />
            </div>

            {/* Zoom Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Zoom</span>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={zoomLevel} 
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--border-light)', cursor: 'pointer' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setIsCropperOpen(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsCropperOpen(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#ffffff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
