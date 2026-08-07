import { useState } from 'react';
import { 
  Bell, Mail, Volume2, Info, ChevronDown, ListFilter, Activity
} from 'lucide-react';

export function NotificationsTab() {
  // Toggle states
  const [emailSecurity, setEmailSecurity] = useState(true);
  const [emailActivity, setEmailActivity] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  
  const [pushDirectMessage, setPushDirectMessage] = useState(true);
  const [pushMention, setPushMention] = useState(true);
  const [pushSystemAlert, setPushSystemAlert] = useState(true);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [frequency, setFrequency] = useState('immediate');
  
  const [dropdownLimit, setDropdownLimit] = useState(() => {
    const saved = localStorage.getItem('gs_notificationsToShow');
    return saved || '5';
  });

  // Accordion states
  const [isEmailExpanded, setIsEmailExpanded] = useState(false);
  const [isInAppExpanded, setIsInAppExpanded] = useState(false);

  const handleDropdownLimitChange = (val: string) => {
    setDropdownLimit(val);
    localStorage.setItem('gs_notificationsToShow', val);
    window.dispatchEvent(new Event('gs_notificationsToShow_changed'));
  };

  // Internal component for the Apple-style toggle
  const AppleToggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange?: (val: boolean) => void, disabled?: boolean }) => {
    return (
      <button
        type="button"
        disabled={disabled}
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

  return (
    <div className="settings-cards-grid">
      <div className="settings-card">
        {/* ROW 1: Email Notifications (Accordion) */}
        <div 
          onClick={() => {
            if (!isEmailExpanded) {
              setIsEmailExpanded(true);
              setIsInAppExpanded(false);
            } else {
              setIsEmailExpanded(false);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: isEmailExpanded ? 'none' : '1px solid var(--bg-dashboard)',
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
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Email Notifications</div>
                <span title="Configure what emails you want to receive" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: 'var(--text-muted)', 
              transform: isEmailExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.05s ease'
            }} 
          />
        </div>

        {/* ROW 1 SUB-ITEMS: Expanded Email Settings */}
        <div 
          style={{
            paddingLeft: '76px',
            paddingRight: '24px',
            maxHeight: isEmailExpanded ? '300px' : '0px',
            opacity: isEmailExpanded ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: isEmailExpanded ? 'auto' : 'none',
            paddingTop: isEmailExpanded ? '10px' : '0px',
            paddingBottom: isEmailExpanded ? '20px' : '0px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: isEmailExpanded ? '1px solid var(--bg-dashboard)' : '0px solid transparent',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'all 0.05s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
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

          {/* Sub-item 1 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-37px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-hover)', border: '1px solid var(--bg-card)', boxShadow: '0 0 0 2px var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Security alerts</div>
              <span title="Get notified about logins, password changes and MFA alerts." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}><Info size={13} /></span>
            </div>
            <AppleToggle checked={emailSecurity} onChange={setEmailSecurity} />
          </div>

          {/* Sub-item 2 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-37px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-hover)', border: '1px solid var(--bg-card)', boxShadow: '0 0 0 2px var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Account activity</div>
              <span title="Receive updates on workspace updates and team activity." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}><Info size={13} /></span>
            </div>
            <AppleToggle checked={emailActivity} onChange={setEmailActivity} />
          </div>

          {/* Sub-item 3 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-37px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-hover)', border: '1px solid var(--bg-card)', boxShadow: '0 0 0 2px var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Marketing & Product updates</div>
              <span title="Tips, features announcements, and general newsletter updates." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}><Info size={13} /></span>
            </div>
            <AppleToggle checked={emailMarketing} onChange={setEmailMarketing} />
          </div>
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 2: In-App & Push Notifications (Accordion) */}
        <div 
          onClick={() => {
            if (!isInAppExpanded) {
              setIsInAppExpanded(true);
              setIsEmailExpanded(false);
            } else {
              setIsInAppExpanded(false);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: isInAppExpanded ? 'none' : '1px solid var(--bg-dashboard)',
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
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>In-App & Push Notifications</div>
                <span title="Configure desktop and dashboard alerts" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: 'var(--text-muted)', 
              transform: isInAppExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.05s ease'
            }} 
          />
        </div>

        {/* ROW 2 SUB-ITEMS */}
        <div 
          style={{
            paddingLeft: '76px',
            paddingRight: '24px',
            maxHeight: isInAppExpanded ? '300px' : '0px',
            opacity: isInAppExpanded ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: isInAppExpanded ? 'auto' : 'none',
            paddingTop: isInAppExpanded ? '10px' : '0px',
            paddingBottom: isInAppExpanded ? '20px' : '0px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: isInAppExpanded ? '1px solid var(--bg-dashboard)' : '1px solid var(--bg-dashboard)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'all 0.05s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{ position: 'absolute', left: '42px', top: '0px', bottom: '36px', width: '1px', backgroundColor: 'var(--border-light)' }} />

          {/* Sub-item 1 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-37px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-hover)', border: '1px solid var(--bg-card)', boxShadow: '0 0 0 2px var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Direct Messages</div>
              <span title="Show alerts when team members message you directly." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}><Info size={13} /></span>
            </div>
            <AppleToggle checked={pushDirectMessage} onChange={setPushDirectMessage} />
          </div>

          {/* Sub-item 2 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-37px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-hover)', border: '1px solid var(--bg-card)', boxShadow: '0 0 0 2px var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Mentions & Replies</div>
              <span title="Get notified when tagged inside reports or comment sections." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}><Info size={13} /></span>
            </div>
            <AppleToggle checked={pushMention} onChange={setPushMention} />
          </div>

          {/* Sub-item 3 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-37px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-hover)', border: '1px solid var(--bg-card)', boxShadow: '0 0 0 2px var(--border-light)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>System alerts</div>
              <span title="Realtime alert updates when system exceptions are logged." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}><Info size={13} /></span>
            </div>
            <AppleToggle checked={pushSystemAlert} onChange={setPushSystemAlert} />
          </div>
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 3: Digest Frequency */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--bg-dashboard)',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Activity size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Digest Frequency</div>
                <span title="Select how often you wish to receive system email digests." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-hover)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500
            }}
          >
            <option value="immediate">Immediate</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Summary</option>
          </select>
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 4: Notification Sound */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--bg-dashboard)',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Volume2 size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Notification Sound</div>
                <span title="Play an alert chime sound whenever a new notification lands." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <AppleToggle checked={soundEnabled} onChange={setSoundEnabled} />
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 5: Dropdown View Limit */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ListFilter size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>Dropdown Notification Limit</div>
                <span title="Select how many notifications to view in the dropdown header." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <select
            value={dropdownLimit}
            onChange={(e) => handleDropdownLimitChange(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-hover)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500
            }}
          >
            <option value="5">5 Notifications</option>
            <option value="10">10 Notifications</option>
          </select>
        </div>

      </div>
    </div>
  );
}
