import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Download, FileText, Bell, Search, Maximize2, Minimize2, MailOpen } from 'lucide-react';
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
    backgroundColor: '#e9ecef',
    border: '2px solid var(--bg-card)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#212529',
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
      <div style={{ ...baseStyle, backgroundColor: '#eff6ff', color: 'var(--primary)' }}>
        <Settings size={12} strokeWidth={2.5} />
      </div>
    );
  }

  if (type === 'warning') {
    return (
      <div style={{ ...baseStyle, backgroundColor: '#fffbeb', color: 'var(--warning)' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', lineHeight: 1 }}>!</span>
      </div>
    );
  }

  if (lower.includes('invite') || lower.includes('added')) {
    return (
      <div style={{ ...baseStyle, backgroundColor: '#e9ecef', color: '#212529' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', lineHeight: 1 }}>+</span>
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      <span style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: 1 }}>i</span>
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
  onSettingsClick?: () => void;
}

export function NotificationDropdown(props: NotificationDropdownProps) {
  const { notifications, onClose, onMarkAllRead, onNotificationClick: _onNotificationClick, onViewAllClick: _onViewAllClick, onSettingsClick } = props;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'unread'>('mentions');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isModalMode, setIsModalMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null);
  const itemsPerPage = Number(localStorage.getItem('gs_notificationsToShow') || '5');

  // Handle closing when clicking outside the modal dropdown (only if not in modal mode)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isModalMode && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              borderRadius: '20px',
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
                fontSize: '13px',
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
            <h2 className="new-notification-title">Notification</h2>
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
                  color: 'var(--text-secondary)',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <Search size={18} />
              </button>
              <button className="new-header-action-btn" title="Notification Settings" onClick={onSettingsClick}>
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
                  color: 'var(--text-secondary)',
                  padding: '4px',
                  borderRadius: '4px'
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

      {/* 2. Tabs Row Section */}
      <div className="new-notification-tabs-row" style={{ flexShrink: 0 }}>
        <div className="new-tabs-pill-container">
          <button 
            className={`new-tab-pill-btn ${activeTab === 'mentions' ? 'active' : ''}`}
            onClick={() => setActiveTab('mentions')}
          >
            Mentions
          </button>
          <button 
            className={`new-tab-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            View all
          </button>
          <button 
            className={`new-tab-pill-btn ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
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
      <div className="new-notification-list-scroll" style={isModalMode ? { maxHeight: 'calc(100vh - 270px)', flex: 1 } : { flex: 1 }}>
        {paginatedNotifications.length === 0 ? (
          <div className="new-notification-empty">
            <Bell size={40} className="empty-bell-icon" />
            <p>No notifications found in this view</p>
          </div>
        ) : (
          paginatedNotifications.map(item => {
            const initials = item.initials || item.actorName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'UN';
            const colorTheme = getInitialsBg(initials);
            return (
              <div 
                key={item.id} 
                className={`new-notification-item-row ${!item.isRead ? 'unread' : ''}`}
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
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--bg-dashboard)',
                  background: 'var(--bg-card)',
                  textAlign: 'left',
                  position: 'relative'
                }}
              >
                {/* Detailed Popup View */}
                {expandedNotificationId === item.id && (
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
                      borderRadius: '8px',
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
                              fontSize: '14px', 
                              fontWeight: 400,
                              textTransform: 'uppercase'
                            }}
                          >
                            {initials}
                          </div>
                        )}
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{item.actorName || 'System'}</span>
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
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          {item.description}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
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
                        fontSize: '14px', 
                        fontWeight: 400,
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
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                        {item.actorName || 'System'}
                      </span>
                      <span>{item.actionText || 'alerted'}</span>
                      <span style={{ color: 'var(--border-hover)' }}>•</span>
                      <span style={{ fontSize: '12px' }}>{getTargetEmoji(item.targetName, item.category)}</span>
                      <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{item.targetName || item.title}</span>
                      <span style={{ color: 'var(--border-hover)' }}>•</span>
                      <span>{item.category}</span>
                    </div>

                    {/* Right Side: Time & Unread */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
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
          })
        )}
      </div>

      {/* 5. Pagination controls Section */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          background: 'var(--bg-card)',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Page {currentPage} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: '1px solid var(--border-light, var(--border-light))',
                backgroundColor: 'var(--bg-card)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 400,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.05s ease'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) e.currentTarget.style.backgroundColor = 'var(--bg-dashboard)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              }}
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: '1px solid var(--border-light, var(--border-light))',
                backgroundColor: 'var(--bg-card)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 400,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.05s ease'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = 'var(--bg-dashboard)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              }}
            >
              Next
            </button>
          </div>
        </div>
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
                borderRadius: '16px',
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
            height: itemsPerPage === 10 ? 'calc(100vh - 120px)' : '520px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {renderInnerContent()}
        </div>
      )}
    </>
  );
}
