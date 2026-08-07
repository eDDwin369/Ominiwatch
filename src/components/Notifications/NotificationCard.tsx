import { Settings, FileText, Download } from 'lucide-react';
import type { NotificationItem } from './types';
import avatarImg from '../../assets/john_doe_avatar.png';
import './Notifications.css';

interface NotificationCardProps {
  notification: NotificationItem;
  onClick: (notification: NotificationItem) => void;
}

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


export function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const initials = notification.initials || notification.actorName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'UN';
  const colorTheme = getInitialsBg(initials);

  const getRelativeTime = (date: Date) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diffDays = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const diffHours = Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60));
    const diffMins = Math.round((date.getTime() - Date.now()) / (1000 * 60));
    
    if (Math.abs(diffMins) < 1) return 'Just now';
    if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)} min ago`;
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    return rtf.format(diffDays, 'day');
  };

  const timeText = getRelativeTime(notification.timestamp);

  return (
    <button 
      className={`notification-card-redesign ${!notification.isRead ? 'unread' : ''}`}
      onClick={() => onClick(notification)}
      title={notification.description}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '16px',
        borderBottom: 'none',
        backgroundColor: 'var(--bg-card)',
        width: '100%',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 0.05s ease',
        fontFamily: 'inherit',
        position: 'relative'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dashboard)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
    >
      {/* Left Avatar Column */}
      <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0, marginRight: '14px' }}>
        {notification.actorName && !['system', 'warning', 'integration'].some(k => notification.actorName!.toLowerCase().includes(k)) ? (
          <img 
            src={avatarImg}
            alt={notification.actorName}
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
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            {initials}
          </div>
        )}
        {getBadgeIcon(notification.actionText, notification.type)}
      </div>

      {/* Right Details Column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', paddingTop: '6px' }}>
        {/* Line 1: Actor Name, Time, Unread Dot */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
            {notification.actorName || 'System'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {timeText}
            </span>
            {!notification.isRead && (
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: 'var(--danger)', 
                  borderRadius: '50%', 
                  display: 'inline-block' 
                }} 
              />
            )}
          </div>
        </div>

        {/* Line 2: Action, Emoji, Target, Category */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>{notification.actionText || 'alerted'}</span>
          <span style={{ color: 'var(--border-hover)' }}>•</span>
          <span style={{ fontSize: '12px' }}>{getTargetEmoji(notification.targetName, notification.category)}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{notification.targetName || notification.title}</span>
          <span style={{ color: 'var(--border-hover)' }}>•</span>
          <span>{notification.category}</span>
        </div>

        {/* Buttons / Actions */}
        {notification.hasButtons && (
          <div className="notification-row-actions" onClick={(e) => e.stopPropagation()}>
            <button className="notification-action-decline-btn">Decline</button>
            <button className="notification-action-accept-btn">Accept</button>
          </div>
        )}

        {/* Attachment box */}
        {notification.attachment && (
          <div className="notification-attachment-box" onClick={(e) => e.stopPropagation()}>
            <div className="attachment-file-icon-box">
              <FileText size={18} />
            </div>
            <div className="attachment-file-details">
              <span className="attachment-file-name">{notification.attachment.name}</span>
              <span className="attachment-file-size">{notification.attachment.size}</span>
            </div>
            <button className="attachment-file-download-btn" title="Download file">
              <Download size={16} />
            </button>
          </div>
        )}
      </div>
    </button>
  );
}
