import { useState } from 'react';
import {
  Download, Cookie, Globe, Clock, Shield,
  FileText, Trash2, ChevronRight, ChevronDown, Info
} from 'lucide-react';
import { Dropdown } from '../shared/Dropdown';

export function PreferencesTab() {
  // Accordion state
  const [isCookiesExpanded, setIsCookiesExpanded] = useState(false);
  
  // Interactive values
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('kolkata');
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(false);

  // Apple-style toggle switch component
  const AppleToggle = ({ 
    checked, 
    onChange, 
    disabled 
  }: { 
    checked: boolean; 
    onChange?: (val: boolean) => void; 
    disabled?: boolean; 
  }) => {
    return (
      <button
        type="button"
        onClick={() => {
          if (!disabled && onChange) onChange(!checked);
        }}
        style={{
          position: 'relative',
          width: '42px',
          height: '24px',
          borderRadius: '9999px',
          backgroundColor: checked ? 'var(--success)' : 'var(--border-hover)',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.05s ease',
          padding: 0,
          opacity: disabled ? 0.8 : 1,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '20px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-card)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            transition: 'left 0.05s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </button>
    );
  };

  const handleExportData = () => {
    // Generate dummy JSON backup
    const data = {
      profile: { name: 'Admin User', role: 'Product Manager' },
      preferences: { language, timezone, analyticsCookies, marketingCookies },
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OomniEye_PersonalData_Export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action is permanent and cannot be undone.")) {
      alert("Account deletion request submitted.");
    }
  };

  return (
    <div className="settings-cards-grid">
      <div className="settings-card">
        {/* ROW 1: Export Personal Data */}
        <div 
          onClick={handleExportData}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            cursor: 'pointer',
            transition: 'background-color 0.05s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dashboard)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(var(--primary-rgb, 21, 101, 192), 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Download size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Export personal data</div>
                <span title="Download a copy of your personal data and account information." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 2: Cookie Preference ACCORDION HEADER */}
        <div 
          onClick={() => setIsCookiesExpanded(!isCookiesExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: isCookiesExpanded ? 'none' : '1px solid var(--border-light)',
            cursor: 'pointer',
            transition: 'background-color 0.05s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dashboard)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(var(--primary-rgb, 21, 101, 192), 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Cookie size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Cookie Preference</div>
                <span title="Manage your cookie settings." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: 'var(--text-muted)', 
              transform: isCookiesExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.05s ease'
            }} 
          />
        </div>

        {/* ROW 2 SUB-ITEMS: Expanded Cookies List */}
        <div 
          style={{
            paddingLeft: '76px',
            paddingRight: '24px',
            maxHeight: isCookiesExpanded ? '240px' : '0px',
            opacity: isCookiesExpanded ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: isCookiesExpanded ? 'auto' : 'none',
            paddingTop: isCookiesExpanded ? '10px' : '0px',
            paddingBottom: isCookiesExpanded ? '20px' : '0px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: isCookiesExpanded ? '1px solid var(--border-light)' : '0px solid transparent',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'max-height 0.05s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.05s ease-out, padding 0.05s cubic-bezier(0.4, 0, 0.2, 1), border-bottom-width 0.05s ease'
          }}
        >
          {/* Vertical connector line */}
          <div 
            style={{
              position: 'absolute',
              left: '42px',
              top: '0px',
              bottom: '36px',
              width: '1px',
              backgroundColor: 'var(--border-light)'
            }}
          />

          {/* Sub-item 1: Essential Cookies */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Bullet Node */}
            <div 
              style={{
                position: 'absolute',
                left: '-37px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--border-hover)',
                border: '1px solid var(--bg-card)',
                boxShadow: '0 0 0 2px var(--border-light)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Essential Cookies</div>
                <span title="These cookies are essential for the website to function." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={13} />
                </span>
              </div>
            </div>
            <AppleToggle checked={true} disabled={true} />
          </div>

          {/* Sub-item 2: Analytics Cookies */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Bullet Node */}
            <div 
              style={{
                position: 'absolute',
                left: '-37px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--border-hover)',
                border: '1px solid var(--bg-card)',
                boxShadow: '0 0 0 2px var(--border-light)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Analytic Cookies</div>
                <span title="Help us understand how users interact with our website." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={13} />
                </span>
              </div>
            </div>
            <AppleToggle checked={analyticsCookies} onChange={setAnalyticsCookies} />
          </div>

          {/* Sub-item 3: Marketing Cookies */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Bullet Node */}
            <div 
              style={{
                position: 'absolute',
                left: '-37px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--border-hover)',
                border: '1px solid var(--bg-card)',
                boxShadow: '0 0 0 2px var(--border-light)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Marketing Cookies</div>
                <span title="Used to deliver personalized ads and track performance." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={13} />
                </span>
              </div>
            </div>
            <AppleToggle checked={marketingCookies} onChange={setMarketingCookies} />
          </div>
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 3: Language */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(var(--primary-rgb, 21, 101, 192), 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Globe size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Language</div>
                <span title="Choose your preferred language." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <Dropdown
            variant="rect"
            width="180px"
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'en', label: 'English (US)' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
            ]}
          />
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 4: Timezone */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(var(--primary-rgb, 21, 101, 192), 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Timezone</div>
                <span title="Select your current timezone." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <Dropdown
            variant="rect"
            width="240px"
            value={timezone}
            onChange={setTimezone}
            options={[
              { value: 'kolkata', label: '(GMT+05:30) Asia/Kolkata' },
              { value: 'utc', label: '(GMT+00:00) UTC' },
              { value: 'pst', label: '(GMT-08:00) Pacific Standard Time' },
              { value: 'est', label: '(GMT-05:00) Eastern Standard Time' },
            ]}
          />
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 5: Privacy Policy */}
        <a 
          href="#privacy"
          onClick={(e) => { e.preventDefault(); alert("Redirecting to Privacy Policy..."); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            textDecoration: 'none',
            transition: 'background-color 0.05s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dashboard)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-dashboard)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Shield size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Privacy Policy</div>
                <span title="Read our privacy policy to understand how we protect your data." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </a>

      </div>
      <div className="settings-card">
        {/* ROW 6: Terms of service */}
        <a 
          href="#terms"
          onClick={(e) => { e.preventDefault(); alert("Redirecting to Terms of Service..."); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            textDecoration: 'none',
            transition: 'background-color 0.05s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dashboard)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-dashboard)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Terms of service</div>
                <span title="Read the terms of service and user agreement." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </a>

      </div>
      <div className="settings-card">
        {/* ROW 7: Delete your account */}
        <div 
          onClick={handleDeleteAccount}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            cursor: 'pointer',
            transition: 'background-color 0.05s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-dashboard)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Delete your account</div>
                <span title="Permanently delete your account and all of your data." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAccount();
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--danger)'}
            style={{ 
              background: 'var(--danger)', 
              color: 'var(--on-accent)', 
              border: 'none',
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.05s ease'
            }}
          >
            Delete your account
          </button>
        </div>

      </div>
    </div>
  );
}
