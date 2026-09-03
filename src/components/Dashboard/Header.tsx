import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, X, Camera, User, Maximize2, Minimize2, Sun, Moon } from 'lucide-react';
import { NotificationDropdown } from '../Notifications/NotificationDropdown';
import type { NotificationItem } from '../Notifications/types';
import logo from '../../assets/logo.png';
import './Dashboard.css';
import { useThemeStore } from 'omnieye-theme-studio';

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
  customerLogoShape?: string;
  showCustomerCaption?: boolean;
  customerCaption?: string;
  customerCaptionStyle?: string;
  customerCaptionColor?: string;
  customerCaptionColorFollow?: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onResetLayout?: () => void;
  onSaveLayout?: () => void;
  hasCustomizations?: boolean;
  onOpenThemeStudio?: () => void;
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
  customerName = 'Default Customer',
  customerNameStyle = 'h4',
  customerNameColor: _customerNameColor = '',
  customerColorFollow: _customerColorFollow = true,
  showCustomerLogo = false,
  customerLogo = '',
  customerLogoShape: _customerLogoShape = 'rounded',
  showCustomerCaption = false,
  customerCaption = 'Digital Twin Solutions',
  customerCaptionStyle = 'h6',
  customerCaptionColor = '',
  customerCaptionColorFollow: _customerCaptionColorFollow = true,
  onOpenThemeStudio: _onOpenThemeStudio
}: HeaderProps) {
  // Studio brand identity (appName/appTagline/logo)
  const brand = useThemeStore((s) => s.settings);
  const set = useThemeStore((s) => s.set);
  const studioLogo = brand.logoMode === 'image' && brand.logoUrl ? brand.logoUrl : logo;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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



  return (
    <header 
      className={`dash-header ${isEditing ? 'editing-focus' : ''}`}
      style={{
        background: (headerConfig?.headerBgColor && headerConfig.headerBgColor !== 'transparent')
          ? headerConfig.headerBgColor 
          : 'var(--dash-header-bg, #141b3c)',
        color: '#ffffff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: brand.mode === 'dark' 
          ? '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 2px 6px -1px rgba(0, 0, 0, 0.4)' 
          : '0 4px 20px -2px rgba(15, 23, 42, 0.18), 0 2px 6px -1px rgba(15, 23, 42, 0.1)',
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
                color: '#ffffff',
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
                color: 'rgba(255, 255, 255, 0.65)',
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
                color: '#ffffff', 
                letterSpacing: '0.02em',
                lineHeight: '1.2' 
              }}>
                {customerName || 'Default Customer'}
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
        <button
          className="header-icon-btn"
          title={brand.mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          onClick={() => set({ mode: brand.mode === 'dark' ? 'light' : 'dark' })}
        >
          {brand.mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

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
    </header>
  );
}
