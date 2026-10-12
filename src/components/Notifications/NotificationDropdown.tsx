import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dropdown } from '../shared/Dropdown';
import { Settings, X, Download, FileText, Bell, Search, Maximize2, Minimize2, MailOpen, AtSign, Inbox, Mail, ChevronLeft, ChevronRight, AlertTriangle, Plus, Info } from 'lucide-react';
import type { NotificationItem } from './types';
import avatarImg from '../../assets/john_doe_avatar.png';
import './Notifications.css';

const getInitialsBg = (initials: string) => {
  const code = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const colors = [
    { bg: '#eff6ff', text: '#1d4ed8' }, // blue
    { bg: '#f0fdf4', text: '#15803d' }, // green
    { bg: '#fffbeb', text: '#b45309' }, // amber
    { bg: '#faf5ff', text: '#6b21a8' }, // purple
    { bg: '#fff1f2', text: '#be123c' }, // rose
    { bg: '#f0fdfa', text: '#0f766e' }  // teal
  ];
  return colors[code % colors.length];
};

const getBadgeIcon = (actionText?: string, type?: string) => {
  const lower = actionText?.toLowerCase() || '';
  
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-2px',
    left: '-6px',
    width: '22px',
    height: '22px',
    backgroundColor: 'color-mix(in srgb, var(--text-main) 8%, var(--bg-card))',
    border: '2px solid var(--bg-card)',
    borderRadius: 'calc(var(--radius-unit, 1px) * 8)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-main)',
    zIndex: 2
  };

  if (lower.includes('replied')) {
    return (
      <div style={baseStyle}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 6v6a3 3 0 0 0 3 3h9" />
          <polyline points="14 11 18 15 14 19" />
        </svg>
      </div>
    );
  }
  
  if (lower.includes('commented')) {
    return (
      <div style={baseStyle}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    );
  }

  if (type === 'system' || lower.includes('config') || lower.includes('enabled')) {
    return (
      <div style={{ ...baseStyle, backgroundColor: 'color-mix(in srgb, var(--primary) 14%, var(--bg-card))', color: 'var(--primary)' }}>
        <Settings size={12} strokeWidth={2.5} />
      </div>
    );
  }

  if (type === 'warning') {
    return (
      <div style={{ ...baseStyle, backgroundColor: 'color-mix(in srgb, var(--warning) 16%, var(--bg-card))', color: 'var(--warning)' }}>
        <AlertTriangle size={11} strokeWidth={2.75} />
      </div>
    );
  }

  if (lower.includes('invite') || lower.includes('added')) {
    return (
      <div style={baseStyle}>
        <Plus size={12} strokeWidth={3} />
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      <Info size={12} strokeWidth={2.75} />
    </div>
  );
};

const getTargetEmoji = (target?: string, category?: string) => {
  const lowerTarget = target?.toLowerCase() || '';
  const lowerCat = category?.toLowerCase() || '';
  if (lowerTarget.includes('theme') || lowerTarget.includes('charcoal')) {
    return '🎨';
  }
  if (lowerTarget.includes('aws') || lowerTarget.includes('node') || lowerTarget.includes('server')) {
    return '🚨';
  }
  if (lowerTarget.includes('google') || lowerTarget.includes('profile')) {
    return '🔑';
  }
  if (lowerCat.includes('activity') || lowerTarget.includes('dashboard') || lowerTarget.includes('netnest') || lowerTarget.includes('project')) {
    return '📁';
  }
  return '📁';
};


interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotificationClick: (notification: NotificationItem) => void;
  onViewAllClick: () => void;
}

export function NotificationDropdown(props: NotificationDropdownProps) {
  const { notifications, onClose, onMarkAllRead, onNotificationClick: _onNotificationClick, onViewAllClick: _onViewAllClick } = props;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'unread'>('mentions');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isModalMode, setIsModalMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null);
  // Notification settings live in this window (moved from Account Settings); same storage keys.
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('as_notificationsEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [notificationCount, setNotificationCount] = useState(() => localStorage.getItem('gs_notificationsToShow') || '5');
  const basePerPage = Number(notificationCount);
  const listRef = useRef<HTMLDivElement>(null);
  // Full-screen mode: page size = rows that fit the available height. The measurement is
  // tagged with what it was taken for, so it's only used while that still matches.
  const [fitMeasure, setFitMeasure] = useState<{ key: string; size: number } | null>(null);
  const [viewportTick, setViewportTick] = useState(0);
  // Compact window: one fixed size for every tab and for Settings — the height of the first
  // min(per-page, 10) "View all" rows (measured from a hidden copy), never below 5 standard rows.
  // 15/20 per page scroll inside it; the pager bar is always there, so the size never jumps.
  const MAX_VISIBLE_ROWS = 10;
  const MIN_VISIBLE_ROWS = 5;
  const measureRef = useRef<HTMLDivElement>(null);
  const [standardListHeight, setStandardListHeight] = useState<number | null>(null);
  const [windowHeight, setWindowHeight] = useState<number | null>(null);
  // 10+ rows per page in the compact window: tighter row spacing so 10 rows fit on screen
  const rowPadY = !isModalMode && basePerPage >= MAX_VISIBLE_ROWS ? 0.8 : 1.6;

  const handleToggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem('as_notificationsEnabled', JSON.stringify(next));
  };

  const handleNotificationCountChange = (val: string) => {
    setNotificationCount(val);
    setCurrentPage(1);
    localStorage.setItem('gs_notificationsToShow', val);
    window.dispatchEvent(new Event('gs_notificationsToShow_changed'));
  };

  // Handle closing when clicking outside the modal dropdown (only if not in modal mode)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest?.('.gs-dd-menu')) return;
      if (!isModalMode && dropdownRef.current && !dropdownRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isModalMode]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filter notifications based on the active tab and search query selection
  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'unread') return !item.isRead;
    if (activeTab === 'mentions') return item.isMention === true;
    return true; // default: 'all'
  }).filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = item.title?.toLowerCase().includes(q);
    const matchDesc = item.description?.toLowerCase().includes(q);
    const matchActor = item.actorName?.toLowerCase().includes(q);
    const matchAction = item.actionText?.toLowerCase().includes(q);
    const matchTarget = item.targetName?.toLowerCase().includes(q);
    return matchTitle || matchDesc || matchActor || matchAction || matchTarget;
  });

  // Reset page when tab filters or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const fitKey = `${activeTab}|${searchQuery}|${filteredNotifications.length}|${viewportTick}`;
  const modalPageSize = isModalMode && fitMeasure?.key === fitKey ? fitMeasure.size : null;
  // While measuring (no valid size yet), render every row so their real heights can be read.
  const itemsPerPage = isModalMode
    ? (modalPageSize ?? Math.max(filteredNotifications.length, 1))
    : basePerPage;
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Back to page 1 whenever the list being paged changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [isModalMode, fitKey]);

  useEffect(() => {
    if (!isModalMode) return;
    const onResize = () => setViewportTick(t => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isModalMode]);

  useLayoutEffect(() => {
    if (!isModalMode || fitMeasure?.key === fitKey) return;
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>(':scope > .new-notification-item-row'));
    const available = list.clientHeight;
    const allHeight = rows.reduce((h, r) => h + r.offsetHeight, 0);
    if (allHeight <= available) {
      setFitMeasure({ key: fitKey, size: Math.max(rows.length, 1) }); // everything fits → single page, no pager
      return;
    }
    // The pager bar is always rendered, so the list's own height is already what's available.
    let used = 0;
    let fit = 0;
    for (const r of rows) {
      if (used + r.offsetHeight > available) break;
      used += r.offsetHeight;
      fit++;
    }
    setFitMeasure({ key: fitKey, size: Math.max(fit, 1) });
  });

  // Compact mode: read the hidden "View all" copy → standard list height; then, outside Settings,
  // remember the resulting window height so the Settings view keeps exactly the same size.
  useLayoutEffect(() => {
    if (isModalMode) return;
    const measured = measureRef.current?.offsetHeight ?? null;
    if (measured !== null && measured !== standardListHeight) setStandardListHeight(measured);
    if (!showSettings && dropdownRef.current) {
      const h = dropdownRef.current.offsetHeight;
      if (h && h !== windowHeight) setWindowHeight(h);
    }
  });

  const standardRows = notifications.slice(0, Math.min(basePerPage, MAX_VISIBLE_ROWS));
  const minListHeight = `${MIN_VISIBLE_ROWS} * (42px + 2 * var(--container-pad, 10px) * ${rowPadY} * var(--table-row-pad-scale, 1))`;
  const compactListHeight = `min(max(${standardListHeight ?? 0}px, calc(${minListHeight})), calc(100vh - 230px))`;

  // One notification row (also rendered hidden, `measuring`, to size the compact window)
  const renderRow = (item: NotificationItem, measuring = false) => {
    const initials = item.initials || item.actorName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'UN';
    const colorTheme = getInitialsBg(initials);
    return (
      <div 
        key={item.id} 
        className={`new-notification-item-row ${!item.isRead ? 'unread' : ''}`}
        data-hms-label="Notification"
        data-hms-type="List item"
        onClick={(e) => {
          // Keep row clicks from reaching the container-level handler
          // (which closes the detail box), so a row can open/switch it.
          e.stopPropagation();
          if (expandedNotificationId === item.id) {
            setExpandedNotificationId(null);
          } else {
            setExpandedNotificationId(item.id);
          }
        }}
        title={item.description}
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          padding: `calc(var(--container-pad, 10px) * ${rowPadY} * var(--table-row-pad-scale, 1)) calc(var(--container-pad, 10px) * 2)`,
          borderBottom: '1px solid var(--bg-dashboard)',
          background: 'var(--bg-card)',
          textAlign: 'left',
          position: 'relative'
        }}
      >
        {/* Detailed Popup View */}
        {!measuring && expandedNotificationId === item.id && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '20px',
              left: '60px',
              right: '20px',
              width: 'auto',
              backgroundColor: 'var(--bg-dashboard)',
              border: '1px solid var(--border-light)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              borderRadius: 'calc(var(--radius-unit, 1px) * 8)',
              padding: '16px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Top Row: Avatar + Heading + Close Icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.actorName && !['system', 'warning', 'integration'].some(k => item.actorName!.toLowerCase().includes(k)) ? (
                  <img 
                    src={avatarImg}
                    alt={item.actorName}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      backgroundColor: colorTheme.bg, 
                      color: colorTheme.text, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: 'var(--font-size-body-sm, 14px)',
                      fontWeight: 'var(--app-font-weight, 400)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {initials}
                  </div>
                )}
                <span style={{ fontWeight: 'var(--font-weight-strong, 600)', fontSize: 'var(--font-size-body-sm, 14px)', color: 'var(--text-main)' }}>{item.actorName || 'System'}</span>
              </div>
              <button 
                onClick={() => setExpandedNotificationId(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '48px' }}>
              {item.description && (
                <p style={{ margin: 0, fontSize: 'var(--font-size-body-sm, 14px)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {item.description}
                </p>
              )}
              <p style={{ margin: 0, fontSize: 'var(--font-size-body-sm, 14px)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Detailed content expanded version of the notification with logo and all.
              </p>
            </div>
          </div>
        )}
        {/* Left Column: Avatar + Badge */}
        <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0, marginRight: '14px' }}>
          {item.actorName && !['system', 'warning', 'integration'].some(k => item.actorName!.toLowerCase().includes(k)) ? (
            <img 
              src={avatarImg}
              alt={item.actorName}
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div 
              style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', 
                backgroundColor: colorTheme.bg, 
                color: colorTheme.text, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: 'var(--font-size-body-sm, 14px)',
                fontWeight: 'var(--app-font-weight, 400)',
                textTransform: 'uppercase'
              }}
            >
              {initials}
            </div>
          )}
          {getBadgeIcon(item.actionText, item.type)}
        </div>

        {/* Right Details Column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Single Line: Actor Name, Action, Target, Category, Time, Unread Dot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
            
            {/* Left Side Info */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', gap: '4px', fontSize: 'var(--font-size-caption, 12px)', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 'var(--font-weight-strong, 600)', fontSize: 'var(--font-size-body-sm, 14px)', color: 'var(--text-main)' }}>
                {item.actorName || 'System'}
              </span>
              <span>{item.actionText || 'alerted'}</span>
              <span style={{ color: 'var(--border-hover)' }}>•</span>
              <span>{getTargetEmoji(item.targetName, item.category)}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{item.targetName || item.title}</span>
              <span style={{ color: 'var(--border-hover)' }}>•</span>
              <span>{item.category}</span>
            </div>

            {/* Right Side: Time & Unread */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: 'var(--font-size-caption, 12px)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {item.dateText || 'Just now'}
              </span>
              {!item.isRead && (
                <span 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: 'var(--danger)', 
                    borderRadius: '50%', 
                    display: 'inline-block',
                    flexShrink: 0
                  }} 
                />
              )}
            </div>
          </div>

          {/* Accept/Decline action buttons */}
          {item.hasButtons && (
            <div className="notification-row-actions" onClick={(e) => e.stopPropagation()}>
              <button className="notification-action-decline-btn">Decline</button>
              <button className="notification-action-accept-btn">Accept</button>
            </div>
          )}

          {/* PDF File Attachment preview block */}
          {item.attachment && (
            <div className="notification-attachment-box" onClick={(e) => e.stopPropagation()}>
              <div className="attachment-file-icon-box">
                <FileText size={18} />
              </div>
              <div className="attachment-file-details">
                <span className="attachment-file-name">{item.attachment.name}</span>
                <span className="attachment-file-size">{item.attachment.size}</span>
              </div>
              <button className="attachment-file-download-btn" title="Download file">
                <Download size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInnerContent = () => (
    <>
      {/* 1. Header Section */}
      <div className="new-notification-header" style={{ flexShrink: 0, height: '48px', minHeight: '48px', display: 'flex', alignItems: 'center' }}>
        {isSearchExpanded ? (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%', 
              gap: '8px', 
              background: 'var(--bg-dashboard)', 
              padding: '4px 12px', 
              borderRadius: 'calc(var(--radius-unit, 1px) * 20)',
              height: '34px',
              transition: 'all 0.05s ease'
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => {
                e.stopPropagation();
                setSearchQuery(e.target.value);
              }}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 'var(--font-size-body-sm, 14px)',
                color: 'var(--text-main)',
                background: 'transparent',
                width: '100%'
              }}
            />
            <button 
              onClick={() => {
                setIsSearchExpanded(false);
                setSearchQuery('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                flexShrink: 0
              }}
              title="Close search"
              className="new-header-action-btn"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="page-title-group">
              <span className="page-title-icon" aria-hidden="true"><Bell size={18} /></span>
              <h2 className="new-notification-title brand-gradient-text">Notifications</h2>
            </div>
            <div className="new-notification-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button 
                className="new-header-action-btn" 
                onClick={() => {
                  setIsSearchExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                title="Search notifications"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: 'calc(var(--radius-unit, 1px) * 4)'
                }}
              >
                <Search size={18} />
              </button>
              <button
                className={`new-header-action-btn ${showSettings ? 'active' : ''}`}
                title="Notification Settings"
                aria-pressed={showSettings}
                onClick={() => setShowSettings(v => !v)}
              >
                <Settings size={18} />
              </button>
              <button 
                className="new-header-action-btn" 
                onClick={() => setIsModalMode(!isModalMode)}
                title={isModalMode ? "Shrink notification list" : "Expand notification list"}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: 'calc(var(--radius-unit, 1px) * 4)'
                }}
              >
                {isModalMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button className="new-header-action-btn close" onClick={onClose} title="Close">
                <X size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {showSettings ? (
        <div className="new-notification-settings">
          <nav className="new-notif-breadcrumb" aria-label="Breadcrumb">
            <button type="button" className="new-notif-settings-back" onClick={() => setShowSettings(false)} title="Back to notifications">
              <ChevronLeft size={16} /> Notifications
            </button>
            <ChevronRight size={14} className="new-notif-breadcrumb-sep" aria-hidden="true" />
            <span className="new-notif-breadcrumb-current" aria-current="page">Settings</span>
          </nav>
          <div className="new-notif-settings-card">
          <div className="new-notif-setting-row">
            <span className="new-notif-setting-label">Notifications</span>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label="Notifications"
              className={`new-notif-switch ${notificationsEnabled ? 'on' : ''}`}
              onClick={handleToggleNotifications}
            >
              <span className="new-notif-switch-thumb" />
            </button>
          </div>
          <div className="new-notif-setting-row">
            <span className="new-notif-setting-label">Notifications per page</span>
            <Dropdown
              value={notificationCount}
              onChange={handleNotificationCountChange}
              variant="rect"
              width={72}
              menuMinWidth={0}
              options={['5', '10', '15', '20']}
            />
          </div>
          </div>
        </div>
      ) : (
      <>
      {/* 2. Tabs Row Section */}
      <div className="new-notification-tabs-row" style={{ flexShrink: 0 }}>
        <div className="new-tabs-pill-container">
          <button 
            className={`new-tab-pill-btn ${activeTab === 'mentions' ? 'active' : ''}`}
            data-tip="Notifications that mention you."
            onClick={() => setActiveTab('mentions')}
          >
            <span className="new-tab-icon"><AtSign size={15} /></span>
            Mentions
          </button>
          <button 
            className={`new-tab-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            data-tip="Every notification."
            onClick={() => setActiveTab('all')}
          >
            <span className="new-tab-icon"><Inbox size={15} /></span>
            View all
          </button>
          <button 
            className={`new-tab-pill-btn ${activeTab === 'unread' ? 'active' : ''}`}
            data-tip="Notifications you haven't read yet."
            onClick={() => setActiveTab('unread')}
          >
            <span className="new-tab-icon"><Mail size={15} /></span>
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button 
            className="new-mark-all-read-icon-btn" 
            onClick={onMarkAllRead}
            title="Mark all as read"
          >
            <MailOpen size={18} />
          </button>
        )}
      </div>

      {/* 4. Notifications List feed */}
      <div ref={listRef} className="new-notification-list-scroll" style={isModalMode ? { flex: 1, minHeight: 0 } : { flex: '0 0 auto', height: compactListHeight }}>
        {paginatedNotifications.length === 0 ? (
          <div className="new-notification-empty">
            <Bell size={40} className="empty-bell-icon" />
            <p>No notifications found in this view</p>
          </div>
        ) : (
          paginatedNotifications.map(item => renderRow(item))
        )}
      </div>

      {/* 5. Pagination controls Section */}
      {/* Pager bar is always shown (compact and full screen), so the layout is identical on every tab */}
      {(
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderTop: '1px solid var(--border-light)',
          background: 'transparent',
          flexShrink: 0
        }}>
          <div style={{ fontSize: 'var(--font-size-caption, 12px)', color: 'var(--text-muted)' }}>
            Page {currentPage} of {Math.max(totalPages, 1)}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              className="shell-btn-secondary shell-btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="shell-btn-secondary shell-btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </>
  );

  return (
    <>
      {isModalMode && (
        createPortal(
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setIsModalMode(false)}
          >
            <div
              className="new-notification-dropdown"
              ref={dropdownRef}
              onClick={(e) => {
                // Keep clicks from closing the modal backdrop, but do close the
                // open detail box when clicking anywhere outside it.
                e.stopPropagation();
                setExpandedNotificationId(null);
              }}
              style={{
                position: 'relative',
                width: '800px',
                height: 'calc(100vh - 120px)',
                marginTop: 0,
                right: 'auto',
                top: 'auto',
                borderRadius: 'calc(var(--radius-unit, 1px) * 16)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                animation: 'none',
                transition: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {renderInnerContent()}
            </div>
          </div>,
          document.body
        )
      )}
      {!isModalMode && (
        <div
          className="new-notification-dropdown"
          ref={dropdownRef}
          onClick={() => setExpandedNotificationId(null)}
          style={{
            // Sized to its rows (5 or 10 fit with no scrollbar), never taller than the screen;
            // Settings keeps the same height as the notification views.
            maxHeight: 'calc(100vh - 72px)',
            height: showSettings && windowHeight ? `${windowHeight}px` : undefined,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {renderInnerContent()}
          {/* Hidden copy of the first "View all" rows — measured to size the list */}
          <div ref={measureRef} aria-hidden="true" className="new-notification-measure">
            {standardRows.map(item => renderRow(item, true))}
          </div>
        </div>
      )}
    </>
  );
}
