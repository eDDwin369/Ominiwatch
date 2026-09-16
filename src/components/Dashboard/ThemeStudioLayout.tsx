import { ThemeStudio } from '../ThemeStudio/ThemeStudio';
import { OrdersView } from './OrdersView';
import { PlaceholderView } from './PlaceholderView';
import { PreviewLogin } from './PreviewLogin';
import { FormView } from './FormView';
import { TemplateWelcome } from './TemplateWelcome';
import { AccountSettings } from '../AccountSettings/AccountSettings';
import { NotificationsPage } from '../Notifications/NotificationsPage';
import type { NotificationItem } from '../Notifications/types';
import './ThemeStudioLayout.css';
import { Bell } from 'lucide-react';

interface ThemeStudioLayoutProps {
  onClose: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
  notifications: NotificationItem[];
  handleMarkAllRead: () => void;
  handleClearRead: () => void;
  handleNotificationClick: (n: NotificationItem) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (v: boolean) => void;
}

export function ThemeStudioLayout({
  onClose,
  currentView,
  onNavigate,
  notifications,
  handleMarkAllRead,
  handleClearRead,
  handleNotificationClick,
  hasUnsavedChanges,
  setHasUnsavedChanges
}: ThemeStudioLayoutProps) {
  
  // Render the inner content based on currentView
  const renderInnerContent = () => {
    if (currentView === 'overview') return <TemplateWelcome onNavigate={onNavigate} />;
    if (currentView === 'notifications') return (
      <NotificationsPage 
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onClearRead={handleClearRead}
        onNotificationClick={handleNotificationClick}
      />
    );
    if (currentView === 'account') return (
      <AccountSettings 
        hasUnsavedChanges={hasUnsavedChanges}
        setHasUnsavedChanges={setHasUnsavedChanges}
      />
    );
    if (currentView === 'orders') return <OrdersView />;
    if (currentView === 'login') return <PreviewLogin />;
    if (currentView === 'form') return <FormView />;
    
    const placeholders = ['operations', 'cameras', 'reports', 'settings', 'components'];
    if (placeholders.includes(currentView)) {
      return <PlaceholderView title={currentView.charAt(0).toUpperCase() + currentView.slice(1)} />;
    }
    
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h2>{currentView.replace('-', ' ').toUpperCase()}</h2>
        <p style={{ marginTop: '16px' }}>This page is under construction.</p>
      </div>
    );
  };

  return (
    <div className="ts-layout-wrapper">
      {/* Left Panel */}
      <ThemeStudio 
        onClose={onClose} 
        currentView={currentView}
        onNavigate={onNavigate}
      />
      
      {/* Right Preview Area */}
      <div className="ts-layout-preview-area">
        <div className="ts-layout-mock-window">
          {/* Mock Window Header */}
          {currentView !== 'login' && (
            <div className="ts-layout-mock-header">
              <div className="ts-layout-mock-header-left">
                <div className="ts-layout-mock-logo">NE</div>
                <span className="ts-layout-mock-title">Nexus ERP</span>
              </div>
              <div className="ts-layout-mock-header-right">
                <button className="ts-layout-mock-icon-btn">
                  <Bell size={16} />
                  <span className="ts-layout-mock-badge">2</span>
                </button>
                <div className="ts-layout-mock-status">
                  <span className="status-dot"></span> Online
                </div>
                <div className="ts-layout-mock-avatar">AD</div>
              </div>
            </div>
          )}
          
          {/* Mock Window Content */}
          <div className="ts-layout-mock-content" style={currentView === 'login' ? { padding: 0 } : {}}>
            {renderInnerContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
