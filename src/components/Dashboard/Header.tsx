import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, X, Camera, User, Maximize2, Minimize2 } from 'lucide-react';
import { NotificationDropdown } from '../Notifications/NotificationDropdown';
import type { NotificationItem } from '../Notifications/types';
import logo from '../../assets/logo.png';
import './Dashboard.css';
import { useThemeStore } from 'omnieye-theme-studio';

const PRESET_THEMES = [
  { id: 'corporate', label: 'Corporate Blue', snap: { primaryHex: '#1565c0', secondaryHex: '#00897b', iconColor: '#1565c0' } },
  { id: 'emerald', label: 'Emerald Green', snap: { primaryHex: '#2e7d32', secondaryHex: '#00897b', iconColor: '#2e7d32' } },
  { id: 'indigo', label: 'Indigo Violet', snap: { primaryHex: '#3949ab', secondaryHex: '#7c4dff', iconColor: '#3949ab' } },
  { id: 'slate', label: 'Graphite Charcoal', snap: { primaryHex: '#455a64', secondaryHex: '#78909c', iconColor: '#455a64' } },
  { id: 'teal', label: 'Ocean Teal', snap: { primaryHex: '#00838f', secondaryHex: '#0277bd', iconColor: '#00838f' } },
  { id: 'amber', label: 'Amber Orange', snap: { primaryHex: '#e65100', secondaryHex: '#d84315', iconColor: '#e65100' } }
];

interface HeaderProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onNotificationClick: (notification: NotificationItem) => void;
  onViewAllClick: () => void;
  onLogout?: () => void;
  onNavigate?: (view: string, options?: any) => void;
  onSettingsClick?: () => void;
  headerConfig?: any;
  isEditing?: boolean;
  showCustomerProfile?: boolean;
  customerName?: string;
  customerNameStyle?: string;
  customerNameColor?: string;
  customerColorFollow?: boolean;
  showCustomerLogo?: boolean;
  customerLogo?: string;
  showCustomerCaption?: boolean;
  customerCaption?: string;
  customerCaptionStyle?: string;
  customerCaptionColor?: string;
}

export function Header({
  notifications,
  onMarkAllRead,
  onNotificationClick,
  onViewAllClick,
  onLogout,
  onNavigate,
  onSettingsClick,
  headerConfig,
  isEditing = false,
  showCustomerProfile = true,
  customerName = 'OomniEye',
  customerNameStyle = 'h1',
  customerNameColor = '#ffffff',
  customerColorFollow = false,
  showCustomerLogo = false,
  customerLogo = '',
  showCustomerCaption = true,
  customerCaption = 'Digital Twin Solutions',
  customerCaptionStyle = 'h3',
  customerCaptionColor = 'rgba(255, 255, 255, 0.65)'
}: HeaderProps) {
  // Studio brand identity (appName/appTagline/logo) — used as fallback when the
  // host's own headerConfig branding is not set, so the studio drives it too.
  const brand = useThemeStore((s) => s.settings);
  const set = useThemeStore((s) => s.set);
  const applyPreset = useThemeStore((s) => s.applyPreset);
  const studioLogo = brand.logoMode === 'image' && brand.logoUrl ? brand.logoUrl : logo;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<string>('corporate');
  // Monotonic rotation (degrees) for the orbiting dot so cycling always spins
  // forward — deriving it from index * 60 made the dot spin backwards when the
  // theme index wrapped from the last preset back to the first.
  const [dotRotation, setDotRotation] = useState(0);
  const [showThemeTooltip, setShowThemeTooltip] = useState(false);
  const [themeToast, setThemeToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const longPressTimerRef = useRef<any>(null);
  const didLongPressRef = useRef<boolean>(false);
  const toastTimeoutRef = useRef<any>(null);

  // Sync theme status from the Zustand store
  useEffect(() => {
    const active = brand.presetId || 'corporate';
    setCurrentTheme(active);
    const activeIndex = PRESET_THEMES.findIndex(t => t.id === active);
    setDotRotation((activeIndex < 0 ? 0 : activeIndex) * 60);
  }, [brand.presetId]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleCycleTheme = () => {
    const currentIndex = PRESET_THEMES.findIndex(t => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % PRESET_THEMES.length;
    const nextTheme = PRESET_THEMES[nextIndex];
    applyPreset(nextTheme.id, nextTheme.snap);
    setCurrentTheme(nextTheme.id);
    // Always advance the dot forward by one step (never snap backwards on wrap).
    setDotRotation(prev => prev + 60);
  };

  const handleMouseDownButton = () => {
    didLongPressRef.current = false;
    setIsHolding(true);
    longPressTimerRef.current = setTimeout(() => {
      const currentMode = brand.mode || 'light';
      const nextMode = currentMode === 'dark' ? 'light' : 'dark';
      set({ mode: nextMode });
      
      // Dispatch event for other components if needed
      window.dispatchEvent(new CustomEvent('theme-mode-change', { detail: nextMode }));
      didLongPressRef.current = true;
      setIsHolding(false);

      // Show temporary toast
      const emoji = nextMode === 'dark' ? '🌙' : '☀️';
      const capitalized = nextMode.charAt(0).toUpperCase() + nextMode.slice(1);
      
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setThemeToast({
        message: `${emoji} Switched to ${capitalized} Mode`,
        visible: true
      });
      toastTimeoutRef.current = setTimeout(() => {
        setThemeToast(prev => ({ ...prev, visible: false }));
      }, 3000);
    }, 500);
  };

  const handleMouseUpButton = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsHolding(false);
    if (!didLongPressRef.current) {
      handleCycleTheme();
    }
    didLongPressRef.current = false;
  };

  const handleMouseLeaveButton = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsHolding(false);
    didLongPressRef.current = false;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImage(url);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const getFontSize = (style?: string, defaultSize: string = '1rem') => {
    switch (style) {
      case 'h1': return '1.5rem';
      case 'h2': return '1.25rem';
      case 'h3': return '1.05rem';
      case 'h4': return '0.85rem';
      case 'h5': return '0.75rem';
      case 'h6': return '0.65rem';
      default: return defaultSize;
    }
  };

  const getHeaderContrastColor = (bgColor?: string) => {
    if (!bgColor) return undefined;
    if (bgColor.includes('gradient')) {
      const hexes = bgColor.match(/#[0-9a-fA-F]{6}/g);
      if (hexes && hexes.length > 0) {
        let totalLum = 0;
        hexes.forEach(h => {
          const hex = h.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          totalLum += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        });
        const avgLum = totalLum / hexes.length;
        return avgLum > 0.55 ? '#0f172a' : '#ffffff';
      }
      return '#ffffff';
    }
    const hex = bgColor.replace('#', '');
    if (hex.length !== 6) return undefined;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#0f172a' : '#ffffff';
  };

  const getHeaderBorderColor = (bgColor?: string) => {
    if (!bgColor || bgColor.toLowerCase() === '#ffffff') return 'var(--border-light, #e2e8f0)';
    const contrast = getHeaderContrastColor(bgColor);
    return contrast === '#ffffff' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
  };

  return (
    <header 
      className={`dash-header ${isEditing ? 'editing-focus' : ''}`}
      style={{
        background: headerConfig?.headerBgColor || 'linear-gradient(135deg, #000000, #011446)',
        color: getHeaderContrastColor(headerConfig?.headerBgColor || 'linear-gradient(135deg, #000000, #011446)') || '#ffffff',
        borderBottom: `1px solid ${getHeaderBorderColor(headerConfig?.headerBgColor)}`,
        transition: 'all 0.2s ease'
      }}
    >
      <div
        className="header-left"
        onClick={() => onNavigate && onNavigate('overview')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '12px',
          cursor: 'pointer'
        }}
      >
        {(!headerConfig || headerConfig.showLogo !== false) && (
          <img
            src={headerConfig?.logo || studioLogo}
            alt="OmniEye Logo"
            style={{ height: '64px', width: 'auto', objectFit: 'contain' }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {(!headerConfig || headerConfig.showCompanyName) && (
            <div
              style={{
                fontWeight: 'bold',
                fontSize: getFontSize(headerConfig?.companyNameStyle, '1.05rem'),
                lineHeight: '1.2',
                color: headerConfig?.companyNameColor || getHeaderContrastColor(headerConfig?.headerBgColor || 'linear-gradient(135deg, #000000, #011446)') || '#ffffff',
                textTransform: 'none',
                letterSpacing: 'normal'
              }}
            >
              {headerConfig?.companyName || brand.appName || 'OomniEye'}
            </div>
          )}
          {(!headerConfig || headerConfig.showCompanyCaption !== false) && (
            <div
              style={{
                fontWeight: '600',
                fontSize: getFontSize(headerConfig?.companyCaptionStyle, '0.75rem'),
                lineHeight: '1.2',
                color: headerConfig?.companyCaptionColor || 
                  (getHeaderContrastColor(headerConfig?.headerBgColor || 'linear-gradient(135deg, #000000, #011446)') === '#ffffff' ? 'rgba(255, 255, 255, 0.65)' : 'var(--text-muted, #64748b)'),
                marginTop: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {headerConfig?.companyCaption || brand.appTagline || 'Digital Twin Solutions'}
            </div>
          )}
        </div>
      </div>

      <div className="header-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        {showCustomerProfile && (
          <>
            {/* Logo in Center */}
            {showCustomerLogo && (customerLogo || logo) && (
              <img
                src={customerLogo || logo}
                alt="Customer Logo"
                style={{ height: '64px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
              />
            )}

            {/* Text/Font in Center */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ 
                fontWeight: 700, 
                fontSize: getFontSize(customerNameStyle, '1.05rem'), 
                color: (!customerColorFollow && customerNameColor && customerNameColor !== '#1e293b' && customerNameColor !== 'transparent') ? customerNameColor : '#ffffff', 
                letterSpacing: '0.02em',
                lineHeight: '1.2' 
              }}>
                {customerName || 'OomniEye'}
              </span>
              {showCustomerCaption && (
                <span style={{
                  fontWeight: 500,
                  fontSize: getFontSize(customerCaptionStyle, '0.75rem'),
                  color: (customerCaptionColor && customerCaptionColor !== 'transparent') ? customerCaptionColor : 'rgba(255, 255, 255, 0.65)',
                  letterSpacing: '0.04em',
                  lineHeight: '1.2',
                  marginTop: '2px',
                  textTransform: 'uppercase'
                }}>
                  {customerCaption || 'Digital Twin Solutions'}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="header-right">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            className="header-icon-btn"
            onMouseEnter={() => setShowThemeTooltip(true)}
            onMouseLeave={() => {
              setShowThemeTooltip(false);
              handleMouseLeaveButton();
            }}
            onMouseDown={handleMouseDownButton}
            onMouseUp={handleMouseUpButton}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="theme-hold-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              {/* Outer Circle */}
              <circle cx="12" cy="12" r="10" stroke={isHolding ? "rgba(0, 0, 0, 0.1)" : "currentColor"} />
              {/* Hold progress circle animation */}
              {isHolding && (
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="url(#theme-hold-grad)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="62.83"
                  strokeDashoffset="62.83"
                  style={{
                    transformOrigin: '12px 12px',
                    transform: 'rotate(-90deg)',
                    /* Match the 500ms long-press threshold so the ring fills
                       exactly as the light/dark switch fires (was 1s). */
                    animation: 'circular-hold 0.5s linear forwards',
                    filter: 'drop-shadow(0 0 3px #a855f7) drop-shadow(0 0 1px #3b82f6)'
                  }}
                />
              )}
              {/* Red dot animated via rotation */}
              <circle
                cx="12"
                cy="6"
                r="2.5"
                fill="var(--danger)"
                stroke="var(--danger)"
                style={{
                  transformOrigin: '12px 12px',
                  transform: `rotate(${dotRotation}deg)`,
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            </svg>
          </button>
          
          {showThemeTooltip && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: '0',
              backgroundColor: '#1e293b',
              border: '1px solid var(--text-secondary)',
              borderRadius: '8px',
              padding: isHolding ? '8px 12px' : '10px 14px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              zIndex: 99999,
              width: isHolding ? '120px' : '240px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textAlign: isHolding ? 'center' : 'left',
              pointerEvents: 'none',
              transition: 'width 0.05s ease, padding 0.05s ease'
            }}>
              {isHolding ? (
                <div style={{ fontWeight: 600, fontSize: '11.5px', color: 'var(--border-light)' }}>
                  Hold for 500ms
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'color-mix(in srgb, var(--primary) 80%, white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Theme: {PRESET_THEMES.find(t => t.id === currentTheme)?.label || 'Corporate Blue'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--border-light)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span>•</span>
                      <span><strong>Click</strong> to cycle through preset themes.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span>•</span>
                      <span><strong>Press & hold</strong> to switch between Light and Dark mode.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button
          className="header-icon-btn"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <button 
          className="header-icon-btn" 
          title="Global Settings" 
          onClick={(e) => {
            e.stopPropagation();
            setShowNotifications(false);
            setShowProfileMenu(false);
            if (onSettingsClick) onSettingsClick();
          }}
        >
          <Settings size={18} />
        </button>

        <div className="header-bell-wrapper">
          <button
            className="header-icon-btn"
            title="Notifications"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="header-bell-indicator" />}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAllRead={onMarkAllRead}
              onNotificationClick={(n) => {
                onNotificationClick(n);
                setShowNotifications(false);
              }}
              onViewAllClick={() => {
                onViewAllClick();
                setShowNotifications(false);
              }}
              onSettingsClick={() => {
                if (onNavigate) {
                  onNavigate('account', { tab: 'notifications' });
                }
                setShowNotifications(false);
              }}
            />
          )}
        </div>

        {/* Profile Card relocate */}
        <div className="header-profile-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            style={{
              background: profileImage ? 'transparent' : '#F3BA2F',
              color: 'white',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'transform 0.05s',
              userSelect: 'none',
              flexShrink: 0,
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              "A"
            )}
          </div>

          {showProfileMenu && (
            <div
              ref={profileMenuRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 16px)', // Positions it exactly below the header bottom border
                right: '-12px', // Very little padding from the right edge of the screen
                background: 'var(--bg-card)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
                width: '230px',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {/* Top User Card section */}
              <div style={{
                background: 'var(--bg-dashboard)',
                padding: '16px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {/* Google-style Profile Avatar with Upload Camera Overlay */}
                <div
                  onClick={triggerFileSelect}
                  onMouseEnter={() => setIsAvatarHovered(true)}
                  onMouseLeave={() => setIsAvatarHovered(false)}
                  style={{
                    position: 'relative',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: profileImage ? 'transparent' : '#F3BA2F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--on-accent)',
                    fontWeight: '600',
                    fontSize: '18px',
                    userSelect: 'none',
                    flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  title="Upload profile picture"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    "A"
                  )}

                  {/* Google-style Camera Hover Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--on-accent)',
                    opacity: isAvatarHovered ? 1 : 0,
                    transition: 'opacity 0.05s ease',
                    borderRadius: '50%'
                  }}>
                    <Camera size={14} />
                  </div>
                </div>

                {/* Hidden Input file selection */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {/* Text credentials */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  minWidth: 0
                }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'var(--text-main)',
                    letterSpacing: '-0.1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}>
                    B Anand
                  </div>
                  <div style={{
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: '450',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Product manager
                  </div>
                </div>
              </div>

              {/* Bottom Menu Items */}
              <div style={{ padding: '4px 0', background: 'var(--bg-card)' }}>
                {/* Profile Settings Item */}
                <div
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onNavigate) onNavigate('account', { editMode: true });
                  }}
                  className="profile-dropdown-item"
                  title="View and update your profile settings"
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--primary)',
                    backgroundColor: 'transparent',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={15} strokeWidth={2.5} />
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>
                    Edit Profile
                  </span>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'rgba(0, 0, 0, 0.06)', margin: '4px 0' }} />

                {/* Sign Out Item */}
                <div
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) onLogout();
                  }}
                  className="profile-dropdown-item danger"
                  title="Sign out from your account"
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--danger)',
                    backgroundColor: 'transparent',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <X size={15} strokeWidth={2.5} />
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--danger)'
                  }}>
                    Sign Out
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {themeToast.visible && (
        <div className="theme-toggle-toast">
          {themeToast.message}
        </div>
      )}
    </header>
  );
}
