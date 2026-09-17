import { useState, useEffect } from 'react';
import { Search, Bell, MailOpen, Trash2 } from 'lucide-react';
import type { NotificationItem } from './types';
import { NotificationCard } from './NotificationCard';
import './Notifications.css';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearRead: () => void;
  onNotificationClick: (notification: NotificationItem) => void;
}

export function NotificationsPage({ 
  notifications, 
  onMarkAllRead, 
  onClearRead, 
  onNotificationClick 
}: NotificationsPageProps) {
  const notificationsToShowSetting = localStorage.getItem('gs_notificationsToShow');
  const itemsPerPage = notificationsToShowSetting ? Number(JSON.parse(notificationsToShowSetting)) : 5;

  const [activeTab, setActiveTab] = useState<string>('Mentions');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const tabs = ['Mentions', 'All', 'Unread', 'Themes', 'Team Activity', 'System'];
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const mentionsCount = notifications.filter(n => n.isMention).length;

  const filteredNotifications = notifications.filter(n => {
    // Tab filter
    if (activeTab === 'Unread' && n.isRead) return false;
    if (activeTab === 'Mentions' && !n.isMention) return false;
    if (activeTab !== 'All' && activeTab !== 'Unread' && activeTab !== 'Mentions' && n.category !== activeTab) return false;
    
    // Search filter
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Reset to first page when tabs or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const groupNotificationsByDate = (notifs: NotificationItem[]) => {
    const groups: { [key: string]: NotificationItem[] } = {
      'Today': [],
      'Yesterday': [],
      'Last 7 Days': [],
      'Older': []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    notifs.forEach(n => {
      const date = new Date(n.timestamp);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        groups['Today'].push(n);
      } else if (date.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(n);
      } else if (date.getTime() >= last7Days.getTime()) {
        groups['Last 7 Days'].push(n);
      } else {
        groups['Older'].push(n);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(paginatedNotifications);
  const hasNotifications = filteredNotifications.length > 0;

  return (
    <div className="notifications-page-container dashboard-fade-in" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div 
        className="tw-parent-card" 
        style={{ 
          background: 'var(--bg-dashboard)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          width: itemsPerPage === 20 ? '96%' : '100%',
          maxWidth: itemsPerPage === 20 ? '96vw' : '100%',
          transition: 'all 0.05s ease'
        }}
      >
        
        {/* Top inner card */}
        <div className="settings-card" style={{ padding: '24px' }}>
          <div className="notifications-page-header" style={{ marginBottom: '20px' }}>
            <h1 className="notifications-page-title">Notifications</h1>
            <div className="notifications-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                className="notification-action-icon-btn" 
                onClick={onMarkAllRead} 
                title="Mark all as read"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.05s'
                }}
              >
                <MailOpen size={18} />
              </button>
              <button 
                className="notification-action-icon-btn" 
                onClick={onClearRead} 
                title="Clear read notifications"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.05s'
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="notifications-toolbar">
            <div className="notifications-tabs">
              {tabs.map(tab => {
                let count = '';
                if (tab === 'Unread') {
                  count = ` (${unreadCount})`;
                } else if (tab === 'Mentions') {
                  count = ` (${mentionsCount})`;
                }
                return (
                  <button 
                    key={tab}
                    className={`notification-tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}{count}
                  </button>
                );
              })}
            </div>
            <div className="notifications-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search notifications..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bottom inner card */}
        <div className="settings-card" style={{ padding: '24px', minHeight: '620px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {!hasNotifications ? (
            <div className="notification-empty" style={{ margin: 'auto' }}>
              <Bell size={64} strokeWidth={1.5} />
              <h4 style={{ fontSize: '18px', marginTop: '16px' }}>You're all caught up</h4>
              <p style={{ fontSize: '15px' }}>No notifications found for this view.</p>
            </div>
          ) : (
            <>
              <div className="notifications-page-list">
                {Object.entries(groupedNotifications).map(([groupName, items]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={groupName}>
                      <div className="notifications-group-title">{groupName}</div>
                      {items.map(notification => (
                        <NotificationCard 
                          key={notification.id} 
                          notification={notification} 
                          onClick={onNotificationClick} 
                        />
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '20px',
                  borderTop: 'none',
                  marginTop: '20px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary, var(--text-muted))' }}>
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredNotifications.length)} to {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
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
                        color: currentPage === 1 ? 'var(--text-muted, var(--text-muted))' : 'var(--text-main, var(--text-main))',
                        fontSize: '13px',
                        fontWeight: 500,
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
                      Previous
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm, 6px)',
                          border: '1px solid ' + (currentPage === pageNum ? 'var(--primary)' : 'var(--border-light)'),
                          backgroundColor: currentPage === pageNum ? 'var(--primary-light)' : 'var(--bg-card)',
                          color: currentPage === pageNum ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.05s ease'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm, 6px)',
                        border: '1px solid var(--border-light, var(--border-light))',
                        backgroundColor: 'var(--bg-card)',
                        color: currentPage === totalPages ? 'var(--text-muted, var(--text-muted))' : 'var(--text-main, var(--text-main))',
                        fontSize: '13px',
                        fontWeight: 500,
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
          )}
        </div>

      </div>
    </div>
  );
}
