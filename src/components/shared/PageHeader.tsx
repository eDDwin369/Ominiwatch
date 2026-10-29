import React from 'react';
import { Camera, Radio, BrainCircuit, History, Bell, Shield, Settings, Sliders } from 'lucide-react';
import './SharedUI.css';

export interface PageHeaderSubItem {
  label: string;
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  subItem?: PageHeaderSubItem;
}

export function PageHeader({ title, subtitle, actions, icon, subItem }: PageHeaderProps) {
  // If no explicit icon was passed, automatically infer the standard icon from title
  const resolvedIcon = icon || (() => {
    const lower = title.toLowerCase();
    if (lower.includes('camera') || lower.includes('oomni')) return <Camera size={20} />;
    if (lower.includes('live') || lower.includes('monitoring')) return <Radio size={20} />;
    if (lower.includes('ai') || lower.includes('analysis')) return <BrainCircuit size={20} />;
    if (lower.includes('flashback') || lower.includes('history')) return <History size={20} />;
    if (lower.includes('notification')) return <Bell size={20} />;
    if (lower.includes('admin') || lower.includes('security')) return <Shield size={20} />;
    if (lower.includes('settings') || lower.includes('account')) return <Settings size={20} />;
    return <Sliders size={20} />;
  })();

  return (
    <div className="figma-settings-header" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {resolvedIcon && (
            <span className="page-title-icon" aria-hidden="true">
              {resolvedIcon}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h1 
              className="figma-settings-title brand-gradient-text" 
              style={{ 
                margin: 0, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px'
              }}
            >
              <span>{title}</span>
              {subItem && (
                <>
                  <span 
                    aria-hidden="true" 
                    style={{ 
                      color: 'var(--text-muted)', 
                      fontWeight: 400, 
                      userSelect: 'none',
                      margin: '0 2px',
                      opacity: 0.8
                    }}
                  >
                    ›
                  </span>
                  <span 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px'
                    }}
                  >
                    {subItem.icon && (
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          color: 'var(--primary)' 
                        }}
                      >
                        {subItem.icon}
                      </span>
                    )}
                    <span>{subItem.label}</span>
                  </span>
                </>
              )}
            </h1>

            {subtitle && (
              <p className="figma-settings-subtitle" style={{ margin: '4px 0 0', width: '100%' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="figma-settings-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
