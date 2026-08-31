import { useState, useEffect, useRef } from 'react';
import { X, FileText, Download, CheckCircle2 } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { TemplateWelcome } from './TemplateWelcome';
import { AccountSettings } from '../AccountSettings/AccountSettings';
import { NotificationsPage } from '../Notifications/NotificationsPage';
import { ThemeStudioEmbed } from './ThemeStudioEmbed';
import { OrdersView } from './OrdersView';
import { PlaceholderView } from './PlaceholderView';
import { PreviewLogin } from './PreviewLogin';
import { FormView } from './FormView';
import { ReportsPage } from './ReportsPage';
import { mockNotifications } from '../Notifications/mockData';
import type { NotificationItem } from '../Notifications/types';
import { GlobalSettingsWorkspace } from '../GlobalSettings/GlobalSettingsWorkspace';
import './Dashboard.css';

interface DashboardProps {
  onLogout?: () => void;
  sidebarLocked: boolean;
  setSidebarLocked: (locked: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  sidebarAutoHide: boolean;
  setSidebarAutoHide: (val: boolean) => void;
  sidebarExpandedWidth: number;
  setSidebarExpandedWidth: (val: number) => void;
  sidebarCollapsedWidth: number;
  setSidebarCollapsedWidth: (val: number) => void;
  sidebarShowIcons: boolean;
  setSidebarShowIcons: (val: boolean) => void;
  sidebarShowLabels: boolean;
  setSidebarShowLabels: (val: boolean) => void;
}

export function Dashboard({ 
  onLogout,
  sidebarLocked: isLocked,
  setSidebarLocked: handleSetIsLocked,
  sidebarCollapsed: collapsed,
  setSidebarCollapsed: handleSetCollapsed,
  sidebarVisible: isVisible,
  setSidebarVisible: setIsVisible,
  sidebarAutoHide,
  setSidebarAutoHide,
  sidebarExpandedWidth,
  setSidebarExpandedWidth,
  sidebarCollapsedWidth,
  setSidebarCollapsedWidth,
  sidebarShowIcons,
  setSidebarShowIcons,
  sidebarShowLabels,
  setSidebarShowLabels
}: DashboardProps) {
  const [currentView, setCurrentView] = useState('overview');
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [selectedFullNotification, setSelectedFullNotification] = useState<NotificationItem | null>(null);

  // Auto display-scaling: shrink the whole shell to fit smaller screens (like
  // Windows display scaling) so the layout never triggers a vertical scrollbar.
  // The layout is designed for a ~1920px baseline; anything narrower is zoomed
  // down proportionally, never up. Consumed by --app-scale in Dashboard.css.
  useEffect(() => {
    const BASE_WIDTH = 1920;
    const MIN_SCALE = 0.6;
    const applyScale = () => {
      const scale = Math.min(1, Math.max(MIN_SCALE, window.innerWidth / BASE_WIDTH));
      document.documentElement.style.setProperty('--app-scale', String(scale));
    };
    applyScale();
    window.addEventListener('resize', applyScale);
    return () => {
      window.removeEventListener('resize', applyScale);
      document.documentElement.style.removeProperty('--app-scale');
    };
  }, []);

  const [editProfileOnLoad, setEditProfileOnLoad] = useState(false);
  const [footerVisible, setFooterVisible] = useState(() => {
    const saved = localStorage.getItem('gs_footerVisible');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [copyrightText, setCopyrightText] = useState(() => {
    return localStorage.getItem('gs_copyrightText') || '© {year} OomniEye. All rights reserved.';
  });
  const [footerPoweredByType, setFooterPoweredByType] = useState(() => {
    try {
      const saved = localStorage.getItem('gs_footerPoweredByType');
      return saved ? JSON.parse(saved) : 'text';
    } catch {
      return 'text';
    }
  });
  const [footerPoweredByText, setFooterPoweredByText] = useState(() => {
    return localStorage.getItem('gs_footerPoweredByText') || '';
  });
  const [footerPoweredByImage, setFooterPoweredByImage] = useState(() => {
    return localStorage.getItem('gs_footerPoweredByImage') || '';
  });
  // Customer Profile states
  const [showCustomerProfile, setShowCustomerProfile] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerProfile');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('gs_customerName') || 'OomniEye';
  });
  const [customerNameStyle, setCustomerNameStyle] = useState(() => {
    return localStorage.getItem('gs_customerNameStyle') || 'h1';
  });
  const [customerNameColor, setCustomerNameColor] = useState(() => {
    const saved = localStorage.getItem('gs_customerNameColor');
    return (saved && saved !== '#1e293b') ? saved : '#ffffff';
  });
  const [customerColorFollow, setCustomerColorFollow] = useState(() => {
    const saved = localStorage.getItem('gs_customerColorFollow');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showCustomerLogo, setShowCustomerLogo] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerLogo');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customerLogo, setCustomerLogo] = useState(() => {
    return localStorage.getItem('gs_customerLogo') || '';
  });
  const [showCustomerCaption, setShowCustomerCaption] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerCaption');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customerCaption, setCustomerCaption] = useState(() => {
    return localStorage.getItem('gs_customerCaption') || 'Digital Twin Solutions';
  });
  const [customerCaptionStyle, setCustomerCaptionStyle] = useState(() => {
    return localStorage.getItem('gs_customerCaptionStyle') || 'h3';
  });
  const [customerCaptionColor, setCustomerCaptionColor] = useState(() => {
    return localStorage.getItem('gs_customerCaptionColor') || 'rgba(255, 255, 255, 0.65)';
  });
  const [footerLinks, setFooterLinks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gs_footerLinks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Global settings modal state
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('');
  const [globalToast, setGlobalToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const globalToastTimeoutRef = useRef<any>(null);

  const showGlobalToast = (message: string) => {
    if (globalToastTimeoutRef.current) clearTimeout(globalToastTimeoutRef.current);
    setGlobalToast({ visible: true, message });
    globalToastTimeoutRef.current = setTimeout(() => {
      setGlobalToast({ visible: false, message: '' });
    }, 3500);
  };
  const [headerConfig, setHeaderConfig] = useState(() => {
    const saved = localStorage.getItem('headerConfig');
    return saved ? JSON.parse(saved) : {
      logo: '',
      showLogo: true,
      companyName: 'OomniEye',
      showCompanyName: true,
      companyCaption: 'Digital Twin Solutions',
      showCompanyCaption: true,
      textColor: '#ffffff',
      textColorApply: 'both',
      companyNameColor: '#ffffff',
      companyCaptionColor: 'rgba(255, 255, 255, 0.65)',
      companyNameStyle: 'h1',
      companyCaptionStyle: 'h3',
      headerBgColor: 'linear-gradient(135deg, #000000, #011446)'
    };
  });

  const handleSaveHeaderConfig = (newConfig: any) => {
    setHeaderConfig(newConfig);
    localStorage.setItem('headerConfig', JSON.stringify(newConfig));
    if (newConfig.startExpanded !== undefined) {
      handleSetCollapsed(!newConfig.startExpanded);
    }
    const savedFooter = localStorage.getItem('gs_footerVisible');
    if (savedFooter !== null) {
      setFooterVisible(JSON.parse(savedFooter));
    }
    const savedCopyright = localStorage.getItem('gs_copyrightText');
    if (savedCopyright) {
      setCopyrightText(savedCopyright);
    }
  };

  const [accountSettingsInitialTab, setAccountSettingsInitialTab] = useState<string | undefined>(undefined);

  const handleSetCurrentView = (view: string, options?: any) => {
    if (view === 'theme-studio') {
      setIsThemeStudioOpen(true);
      return;
    }

    // Navigating anywhere else must close the Theme Studio side rail, otherwise
    // it stays open (and its sidebar item stays highlighted) on top of the new view.
    if (isThemeStudioOpen) {
      setIsThemeStudioOpen(false);
    }

    if (view === currentView && !options && !isThemeStudioOpen) {
      return;
    }

    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
      setHasUnsavedChanges(false);
    }

    if (view === 'account') {
      if (options?.editMode) {
        setEditProfileOnLoad(true);
      } else {
        setEditProfileOnLoad(false);
      }
      setAccountSettingsInitialTab(options?.tab);
    }

    setCurrentView(view);
  };

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    if (onLogout) onLogout();
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearRead = () => {
    setNotifications(prev => prev.filter(n => !n.isRead));
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, isRead: true } : n
    ));
    // Show full content modal
    setSelectedFullNotification(notification);
    // Navigate
    handleSetCurrentView(notification.actionRoute);
  };

  const headerLeftPadding = (!isLocked && isVisible) 
    ? (collapsed ? `${sidebarCollapsedWidth}px` : `${sidebarExpandedWidth}px`) 
    : '0px';

  // Resolve Powered By custom footer branding placeholder fallback
  const resolvedFooterPoweredByText = footerPoweredByText || `Powered by ${headerConfig?.companyName || 'OomniEye'} Digital Solutions`;

  return (
    <div 
      className="dashboard-wrapper dashboard-fade-in"
      style={{
        ['--sidebar-width' as any]: `${sidebarExpandedWidth}px`,
        ['--sidebar-width-collapsed' as any]: `${sidebarCollapsedWidth}px`
      }}
    >
      <Header 
          notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onNotificationClick={handleNotificationClick}
        onViewAllClick={() => handleSetCurrentView('notifications')}
        onLogout={handleLogout}
        onNavigate={handleSetCurrentView}
        onSettingsClick={() => setIsGlobalSettingsOpen(true)}
        headerConfig={headerConfig}
        isEditing={isGlobalSettingsOpen && (activeSettingsTab === 'header' || activeSettingsTab === 'profile')}
        showCustomerProfile={showCustomerProfile}
        customerName={customerName}
        customerNameStyle={customerNameStyle}
        customerNameColor={customerNameColor}
        customerColorFollow={customerColorFollow}
        showCustomerLogo={showCustomerLogo}
        customerLogo={customerLogo}
        showCustomerCaption={showCustomerCaption}
        customerCaption={customerCaption}
        customerCaptionStyle={customerCaptionStyle}
        customerCaptionColor={customerCaptionColor}
      />
      <div className="dashboard-body">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={handleSetCurrentView} 
          isThemeStudioOpen={isThemeStudioOpen}
          isLocked={isLocked}
          setIsLocked={handleSetIsLocked}
          collapsed={collapsed}
          setCollapsed={handleSetCollapsed}
          isVisible={isVisible}
          setIsVisible={setIsVisible}
          autoHideSidebar={sidebarAutoHide}
          showIcons={sidebarShowIcons}
          showLabels={sidebarShowLabels}
          isEditing={isGlobalSettingsOpen && activeSettingsTab === 'sidebar'}
        />
        
        <div className="dashboard-main">
          <div 
            className="dashboard-content-scrollable"
            style={{
              paddingLeft: headerLeftPadding,
              transition: 'padding-left 0.05s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {isThemeStudioOpen ? (
              <ThemeStudioEmbed />
            ) : (
              <div className={`dashboard-container ${['overview', 'account'].includes(currentView) ? 'no-padding' : ''}`}>
                {currentView === 'overview' ? (
                  <TemplateWelcome onNavigate={handleSetCurrentView} />
                ) : currentView === 'notifications' ? (
                  <NotificationsPage 
                    notifications={notifications}
                    onMarkAllRead={handleMarkAllRead}
                    onClearRead={handleClearRead}
                    onNotificationClick={handleNotificationClick}
                  />
                ) : currentView === 'account' ? (
                  <AccountSettings 
                    hasUnsavedChanges={hasUnsavedChanges}
                    setHasUnsavedChanges={setHasUnsavedChanges}
                    editProfileOnLoad={editProfileOnLoad}
                    setEditProfileOnLoad={setEditProfileOnLoad}
                    initialTab={accountSettingsInitialTab}
                  />
                ) : currentView === 'orders' ? (
                  <OrdersView />
                ) : currentView === 'login' ? (
                  <PreviewLogin />
                ) : currentView === 'form' ? (
                  <FormView />
                ) : currentView === 'reports' ? (
                  <ReportsPage />
                ) : ['operations', 'cameras', 'settings', 'components'].includes(currentView) ? (
                  <PlaceholderView title={currentView.charAt(0).toUpperCase() + currentView.slice(1)} />
                ) : (
                  <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <h2>{currentView.replace('-', ' ').toUpperCase()}</h2>
                    <p style={{ marginTop: '16px' }}>This page is under construction. Navigated from notification.</p>
                    <button 
                      onClick={() => handleSetCurrentView('overview')}
                      style={{ marginTop: '24px', padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {(footerVisible || (isGlobalSettingsOpen && activeSettingsTab === 'footer')) && (
        <footer 
          style={{
            height: '32px',
            backgroundColor: 'var(--bg-card, var(--bg-card))',
            borderTop: '1px solid var(--border-light, var(--border-light))',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '0 20px',
            fontSize: '11.5px',
            color: 'var(--text-secondary, var(--text-muted))',
            flexShrink: 0,
            position: 'relative',
            zIndex: (isGlobalSettingsOpen && activeSettingsTab === 'footer') ? 10000 : 40,
            boxShadow: (isGlobalSettingsOpen && activeSettingsTab === 'footer') ? '0 -4px 24px rgba(37, 99, 235, 0.15), 0 0 0 2px rgba(37, 99, 235, 0.5)' : 'none',
            transition: 'box-shadow 0.05s ease, z-index 0.05s ease'
          }}
        >
          {/* Left column */}
          <div>Ready</div>

          {/* Center column */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>{copyrightText.replace('{year}', new Date().getFullYear().toString())}</span>
            {footerLinks.map((linkStr, idx) => {
              const match = linkStr.match(/^(.*?)\s*\((.*?)\)$/);
              const label = match ? match[1] : linkStr;
              const url = match ? match[2] : '#';
              return (
                <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-secondary, var(--text-muted))' }}>·</span>
                  <a 
                    href={url.startsWith('http') ? url : `https://${url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: 'var(--color-primary, var(--primary))', 
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {label}
                  </a>
                </span>
              );
            })}
          </div>

          {/* Right column — powered-by text and image */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            {footerPoweredByType === 'image' && footerPoweredByImage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {resolvedFooterPoweredByText && <span>{resolvedFooterPoweredByText}</span>}
                <img src={footerPoweredByImage} alt="Powered By Logo" style={{ maxHeight: '20px', objectFit: 'contain', display: 'block' }} />
              </div>
            ) : (
              resolvedFooterPoweredByText ? <span>{resolvedFooterPoweredByText}</span> : null
            )}
          </div>
        </footer>
      )}
      {isGlobalSettingsOpen && (
        <GlobalSettingsWorkspace 
          onClose={() => setIsGlobalSettingsOpen(false)} 
          headerConfig={headerConfig}
          onSaveConfig={handleSaveHeaderConfig}
          sidebarAutoHide={sidebarAutoHide}
          setSidebarAutoHide={setSidebarAutoHide}
          sidebarExpandedWidth={sidebarExpandedWidth}
          setSidebarExpandedWidth={setSidebarExpandedWidth}
          sidebarCollapsedWidth={sidebarCollapsedWidth}
          setSidebarCollapsedWidth={setSidebarCollapsedWidth}
          sidebarShowIcons={sidebarShowIcons}
          setSidebarShowIcons={setSidebarShowIcons}
          sidebarShowLabels={sidebarShowLabels}
          setSidebarShowLabels={setSidebarShowLabels}
          onSyncFooter={(footerData) => {
            if (footerData.footerVisible !== undefined) setFooterVisible(footerData.footerVisible);
            if (footerData.copyrightText !== undefined) setCopyrightText(footerData.copyrightText);
            if (footerData.footerPoweredByType !== undefined) setFooterPoweredByType(footerData.footerPoweredByType);
            if (footerData.footerPoweredByText !== undefined) setFooterPoweredByText(footerData.footerPoweredByText);
            if (footerData.footerPoweredByImage !== undefined) setFooterPoweredByImage(footerData.footerPoweredByImage);
            if (footerData.footerLinks !== undefined) setFooterLinks(footerData.footerLinks);
          }}
          setSidebarCollapsed={handleSetCollapsed}
          onTabChange={setActiveSettingsTab}
          onSyncCustomerProfile={(data) => {
            setShowCustomerProfile(data.showCustomerProfile);
            setCustomerName(data.customerName);
            setCustomerColorFollow(data.customerColorFollow);
            setShowCustomerLogo(data.showCustomerLogo);
            setCustomerLogo(data.customerLogo);
            if (data.customerNameStyle) setCustomerNameStyle(data.customerNameStyle);
            if (data.customerNameColor) setCustomerNameColor(data.customerNameColor);
            if (data.showCustomerCaption !== undefined) setShowCustomerCaption(data.showCustomerCaption);
            if (data.customerCaption !== undefined) setCustomerCaption(data.customerCaption);
            if (data.customerCaptionStyle) setCustomerCaptionStyle(data.customerCaptionStyle);
            if (data.customerCaptionColor) setCustomerCaptionColor(data.customerCaptionColor);
          }}
          onShowToast={showGlobalToast}
        />
      )}

      {selectedFullNotification && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000
          }}
          onClick={() => setSelectedFullNotification(null)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              width: '480px',
              maxWidth: '90%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedFullNotification(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            {/* Header / Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                color: 'var(--primary)',
                backgroundColor: '#eff6ff',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {selectedFullNotification.category}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(selectedFullNotification.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', lineHeight: '1.4' }}>
              {selectedFullNotification.title}
            </h3>

            {/* Description */}
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
              {selectedFullNotification.description}
            </p>

            {/* Actor & details if any */}
            {selectedFullNotification.actorName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-dashboard)', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase'
                }}>
                  {selectedFullNotification.actorName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{selectedFullNotification.actorName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedFullNotification.actionText || 'Updated details'}</div>
                </div>
              </div>
            )}

            {/* Attachment if any */}
            {selectedFullNotification.attachment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'var(--bg-dashboard)', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--danger)', color: 'var(--on-accent)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {selectedFullNotification.attachment.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {selectedFullNotification.attachment.size}
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                  <Download size={16} />
                </button>
              </div>
            )}

            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedFullNotification(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {globalToast.visible && (
        <div 
          className="theme-toggle-toast" 
          style={{ 
            background: 'linear-gradient(135deg, #091638 0%, #06102a 100%)', 
            border: '1px solid rgba(59, 130, 246, 0.4)', 
            color: '#ffffff', 
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(29, 78, 216, 0.3)',
            borderRadius: '12px',
            padding: '12px 22px',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
          <span>{globalToast.message}</span>
        </div>
      )}
    </div>
  );
}
