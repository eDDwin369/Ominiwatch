import React, { useState } from 'react';
import { AccountSettings } from '../AccountSettings/AccountSettings';
import { ThemeStudioEmbed } from '../Dashboard/ThemeStudioEmbed';
import { User, Palette } from 'lucide-react';

interface AdministrationPageProps {
  hasUnsavedChanges?: boolean;
  setHasUnsavedChanges?: (value: boolean) => void;
  editProfileOnLoad?: boolean;
  setEditProfileOnLoad?: (value: boolean) => void;
  initialTab?: string;
  defaultAdminTab?: 'account' | 'theme-studio';
  onAdminTabChange?: (tab: 'account' | 'theme-studio') => void;
}

export function AdministrationPage({
  hasUnsavedChanges,
  setHasUnsavedChanges,
  editProfileOnLoad,
  setEditProfileOnLoad,
  initialTab,
  defaultAdminTab = 'account',
  onAdminTabChange
}: AdministrationPageProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'theme-studio'>(defaultAdminTab);

  const handleTabChange = (tab: 'account' | 'theme-studio') => {
    setActiveTab(tab);
    if (onAdminTabChange) onAdminTabChange(tab);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: '100%' }}>
      {/* Sleek Sub-Header Tab Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 32px 0',
          background: 'var(--brand-page-wash, var(--bg-dashboard))',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => handleTabChange('account')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: activeTab === 'account' ? 600 : 500,
            color: activeTab === 'account' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'account' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <User size={16} />
          <span>Account Settings</span>
        </button>

        <button
          onClick={() => handleTabChange('theme-studio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: activeTab === 'theme-studio' ? 600 : 500,
            color: activeTab === 'theme-studio' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'theme-studio' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Palette size={16} />
          <span>Theme Studio</span>
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {activeTab === 'account' ? (
          <AccountSettings
            hasUnsavedChanges={hasUnsavedChanges}
            setHasUnsavedChanges={setHasUnsavedChanges}
            editProfileOnLoad={editProfileOnLoad}
            setEditProfileOnLoad={setEditProfileOnLoad}
            initialTab={initialTab}
          />
        ) : (
          <ThemeStudioEmbed />
        )}
      </div>
    </div>
  );
}
