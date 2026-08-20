import { useState } from 'react';
import { 
  Laptop, Monitor, Smartphone, Clock, Lock, Shield, Key,
  ChevronDown, Info, CheckCircle2, XCircle 
} from 'lucide-react';

export function SecurityTab() {
  // Accordion active state (single state to ensure only one is open at a time)
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const handleToggleAccordion = (key: string) => {
    setActiveAccordion(prev => prev === key ? null : key);
  };

  const isSessionsExpanded = activeAccordion === 'sessions';
  const isHistoryExpanded = activeAccordion === 'history';
  const isPasswordExpanded = activeAccordion === 'password';
  const is2faExpanded = activeAccordion === '2fa';
  const isApiExpanded = activeAccordion === 'api';

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'MacBook Pro',
      browser: 'Chrome 138',
      isCurrent: true,
      os: 'macOS 14.4',
      location: 'San Francisco, CA, US',
      ip: '123.45.67.89',
      lastActive: 'Just now',
      icon: Laptop,
      circleColor: 'var(--primary-light)',
      iconColor: '#9333ea'
    },
    {
      id: 2,
      device: 'Windows Laptop',
      browser: 'Edge 120',
      isCurrent: false,
      os: 'Windows 11',
      location: 'Bangalore, KA, IN',
      ip: '103.21.244.1',
      lastActive: '28 min ago',
      icon: Monitor,
      circleColor: 'var(--primary-light)',
      iconColor: 'var(--primary)'
    },
    {
      id: 3,
      device: 'iPhone 15',
      browser: 'Safari',
      isCurrent: false,
      os: 'iOS 17.4',
      location: 'Mumbai, MH, IN',
      ip: '106.51.23.11',
      lastActive: '2 hours ago',
      icon: Smartphone,
      circleColor: 'var(--success-light)',
      iconColor: 'var(--success)'
    }
  ]);

  const loginActivity = [
    {
      id: 1,
      status: 'success',
      text: 'Successful login',
      device: 'Chrome on macOS',
      location: 'San Francisco, CA, US',
      time: 'Today, 10:30 AM'
    },
    {
      id: 2,
      status: 'success',
      text: 'Successful login',
      device: 'Edge on Windows',
      location: 'Bangalore, KA, IN',
      time: 'Yesterday, 9:15 PM'
    },
    {
      id: 3,
      status: 'failed',
      text: 'Failed login attempt',
      device: 'Chrome on Windows',
      location: 'New Delhi, DL, IN',
      time: 'Yesterday, 8:42 PM'
    },
    {
      id: 4,
      status: 'success',
      text: 'Successful login',
      device: 'Safari on iPhone',
      location: 'Mumbai, MH, IN',
      time: 'Apr 8, 11:21 AM'
    }
  ];

  const handleRevokeSession = (sessionId: number) => {
    if (window.confirm("Are you sure you want to sign out of this device?")) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    alert("Password updated successfully!");
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleConfigure2fa = () => {
    alert("Two-Factor Authentication setup window opened.");
  };

  const handleGenerateApiKey = () => {
    alert("API Token generated: oe_live_51nzX8A2k7m9Lq...");
  };

  return (
    <div className="settings-cards-grid">
      <div className="settings-card">
        {/* ROW 1: Active Sessions Accordion Header */}
        <div 
          onClick={() => handleToggleAccordion('sessions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: isSessionsExpanded ? 'none' : '1px solid var(--bg-dashboard)',
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
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(var(--primary-rgb, 21, 101, 192), 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Laptop size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: 'var(--font-size-14)', fontWeight: 600, color: 'var(--text-main)' }}>Active Sessions</div>
                <span title="Manage and monitor all active sessions across your devices." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: 'var(--text-muted)', 
              transform: isSessionsExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.05s ease'
            }} 
          />
        </div>

        {/* ROW 1 SUB-ITEMS: Expanded Devices list */}
        <div 
          style={{
            paddingLeft: '76px',
            paddingRight: '24px',
            maxHeight: isSessionsExpanded ? '500px' : '0px',
            opacity: isSessionsExpanded ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: isSessionsExpanded ? 'auto' : 'none',
            paddingTop: isSessionsExpanded ? '10px' : '0px',
            paddingBottom: isSessionsExpanded ? '20px' : '0px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: isSessionsExpanded ? '1px solid var(--bg-dashboard)' : '0px solid transparent',
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
              bottom: '42px',
              width: '1px',
              backgroundColor: 'var(--border-light)'
            }}
          />

          {sessions.map(session => {
            const DevIcon = session.icon;
            return (
              <div 
                key={session.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  position: 'relative'
                }}
              >
                {/* Bullet Node */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '-37px',
                    top: '24px',
                    transform: 'translateY(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--border-hover)',
                    border: '1px solid var(--bg-card)',
                    boxShadow: '0 0 0 2px var(--border-light)',
                    zIndex: 2
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: session.circleColor,
                      color: session.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <DevIcon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-body-sm)', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {session.device} • {session.browser}
                      {session.isCurrent && (
                        <span style={{ fontSize: 'var(--font-size-caption)', background: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                          Current
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {session.os} • {session.location}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-muted)', marginTop: '1px' }}>
                      IP: {session.ip} • Last active: {session.lastActive}
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button 
                    onClick={() => handleRevokeSession(session.id)}
                    style={{
                      border: '1px solid var(--border-hover)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-secondary)',
                      padding: '4px 10px',
                      fontSize: 'var(--font-size-caption)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.05s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--danger)';
                      e.currentTarget.style.color = 'var(--danger)';
                      e.currentTarget.style.backgroundColor = 'var(--danger-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                    }}
                  >
                    Sign out
                  </button>
                )}
              </div>
            );
          })}
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 2: Login History Accordion Header */}
        <div 
          onClick={() => handleToggleAccordion('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: isHistoryExpanded ? 'none' : '1px solid var(--bg-dashboard)',
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
                borderRadius: 'var(--radius-md)',
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
                <div style={{ fontSize: 'var(--font-size-14)', fontWeight: 600, color: 'var(--text-main)' }}>Login History</div>
                <span title="A log of your recent account access and authentication events." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: 'var(--text-muted)', 
              transform: isHistoryExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.05s ease'
            }} 
          />
        </div>

        {/* ROW 2 SUB-ITEMS: Expanded Login Activity */}
        <div 
          style={{
            paddingLeft: '76px',
            paddingRight: '24px',
            maxHeight: isHistoryExpanded ? '400px' : '0px',
            opacity: isHistoryExpanded ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: isHistoryExpanded ? 'auto' : 'none',
            paddingTop: isHistoryExpanded ? '10px' : '0px',
            paddingBottom: isHistoryExpanded ? '20px' : '0px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: isHistoryExpanded ? '1px solid var(--bg-dashboard)' : '0px solid transparent',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'max-height 0.05s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.05s ease-out, padding 0.05s cubic-bezier(0.4, 0, 0.2, 1), border-bottom-width 0.05s ease'
          }}
        >
          {/* Vertical connector line */}
          <div 
            style={{
              position: 'absolute',
              left: '42px',
              top: '0px',
              bottom: '24px',
              width: '1px',
              backgroundColor: 'var(--border-light)'
            }}
          />

          {loginActivity.map(activity => (
            <div 
              key={activity.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                position: 'relative'
              }}
            >
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activity.status === 'success' ? (
                  <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                ) : (
                  <XCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {activity.text}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {activity.device} • {activity.location}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-muted)' }}>
                {activity.time}
              </div>
            </div>
          ))}
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 3: Password Settings Accordion Header */}
        <div 
          onClick={() => handleToggleAccordion('password')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: isPasswordExpanded ? 'none' : '1px solid var(--bg-dashboard)',
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
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(var(--primary-rgb, 21, 101, 192), 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Lock size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: 'var(--font-size-14)', fontWeight: 600, color: 'var(--text-main)' }}>Password</div>
                <span title="Last changed: 30 days ago. Update your security password settings." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: 'var(--text-muted)', 
              transform: isPasswordExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.05s ease'
            }} 
          />
        </div>

        {/* ROW 3 SUB-ITEMS: Password Form */}
        <div 
          style={{
            paddingLeft: '76px',
            paddingRight: '24px',
            maxHeight: isPasswordExpanded ? '380px' : '0px',
            opacity: isPasswordExpanded ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: isPasswordExpanded ? 'auto' : 'none',
            paddingTop: isPasswordExpanded ? '10px' : '0px',
            paddingBottom: isPasswordExpanded ? '20px' : '0px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: isPasswordExpanded ? '1px solid var(--bg-dashboard)' : '0px solid transparent',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'max-height 0.05s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.05s ease-out, padding 0.05s cubic-bezier(0.4, 0, 0.2, 1), border-bottom-width 0.05s ease'
          }}
        >
          {/* Vertical connector line */}
          <div 
            style={{
              position: 'absolute',
              left: '42px',
              top: '0px',
              bottom: '24px',
              width: '1px',
              backgroundColor: 'var(--border-light)'
            }}
          />

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px', position: 'relative' }}>
            {/* Bullet Node */}
            <div 
              style={{
                position: 'absolute',
                left: '-37px',
                top: '20px',
                transform: 'translateY(-50%)',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--border-hover)',
                border: '1px solid var(--bg-card)',
                boxShadow: '0 0 0 2px var(--border-light)'
              }}
            />

            <div className="edit-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••" 
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-hover)',
                  fontSize: 'var(--font-size-body-sm)',
                  outline: 'none',
                  backgroundColor: 'var(--bg-card)'
                }} 
              />
            </div>
            
            <div className="edit-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters" 
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-hover)',
                  fontSize: 'var(--font-size-body-sm)',
                  outline: 'none',
                  backgroundColor: 'var(--bg-card)'
                }} 
              />
            </div>

            <div className="edit-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: 'var(--font-size-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password" 
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-hover)',
                  fontSize: 'var(--font-size-body-sm)',
                  outline: 'none',
                  backgroundColor: 'var(--bg-card)'
                }} 
              />
            </div>

            <button 
              type="submit"
              style={{ 
                background: 'var(--btn-color)', color: 'var(--btn-text)', 
                border: 'none',
                padding: '8px 16px', 
                borderRadius: 'var(--radius-md)', 
                fontSize: 'var(--font-size-body-sm)', 
                fontWeight: 600,
                cursor: 'pointer',
                width: 'fit-content',
                marginTop: '6px',
                transition: 'background-color 0.05s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              Update Password
            </button>
          </form>
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 4: Two-Factor Authentication Accordion Header */}
        <div 
          onClick={() => handleToggleAccordion('2fa')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: is2faExpanded ? 'none' : '1px solid var(--bg-dashboard)',
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
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(var(--primary-rgb, 21, 101, 192), 0.1)',
                color: 'var(--primary)',
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
                <div style={{ fontSize: 'var(--font-size-14)', fontWeight: 600, color: 'var(--text-main)' }}>Two-Factor Authentication</div>
                <span title="Add an extra layer of security to your account." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: 'var(--text-muted)', 
              transform: is2faExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.05s ease'
            }} 
          />
        </div>

        {/* ROW 4 SUB-ITEMS: 2FA Content */}
        <div 
          style={{
            paddingLeft: '76px',
            paddingRight: '24px',
            maxHeight: is2faExpanded ? '200px' : '0px',
            opacity: is2faExpanded ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: is2faExpanded ? 'auto' : 'none',
            paddingTop: is2faExpanded ? '10px' : '0px',
            paddingBottom: is2faExpanded ? '20px' : '0px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: is2faExpanded ? '1px solid var(--bg-dashboard)' : '0px solid transparent',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'max-height 0.05s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.05s ease-out, padding 0.05s cubic-bezier(0.4, 0, 0.2, 1), border-bottom-width 0.05s ease'
          }}
        >
          {/* Vertical connector line */}
          <div 
            style={{
              position: 'absolute',
              left: '42px',
              top: '0px',
              bottom: '24px',
              width: '1px',
              backgroundColor: 'var(--border-light)'
            }}
          />

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
              <div style={{ fontSize: 'var(--font-size-body-sm)', fontWeight: 600, color: 'var(--text-main)' }}>Authenticator App</div>
              <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-muted)', marginTop: '1px' }}>Use verification codes generated by Authenticator apps.</div>
            </div>
            <button 
              onClick={handleConfigure2fa}
              style={{
                border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                fontSize: 'var(--font-size-caption)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.05s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'var(--primary-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              }}
            >
              Configure
            </button>
          </div>
        </div>

      </div>
      <div className="settings-card">
        {/* ROW 5: API Tokens Accordion Header */}
        <div 
          onClick={() => handleToggleAccordion('api')}
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
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(var(--primary-rgb, 21, 101, 192), 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Key size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontSize: 'var(--font-size-14)', fontWeight: 600, color: 'var(--text-main)' }}>API Tokens</div>
                <span title="Generate and manage API keys for programmatic access." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)', cursor: 'help' }}>
                  <Info size={14} />
                </span>
              </div>
            </div>
          </div>
          <ChevronDown 
            size={18} 
            style={{ 
              color: 'var(--text-muted)', 
              transform: isApiExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.05s ease'
            }} 
          />
        </div>

        {/* ROW 5 SUB-ITEMS: API Key Generation */}
        <div 
          style={{
            paddingLeft: '76px',
            paddingRight: '24px',
            maxHeight: isApiExpanded ? '200px' : '0px',
            opacity: isApiExpanded ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: isApiExpanded ? 'auto' : 'none',
            paddingTop: isApiExpanded ? '10px' : '0px',
            paddingBottom: isApiExpanded ? '20px' : '0px',
            backgroundColor: 'var(--bg-card)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'max-height 0.05s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.05s ease-out, padding 0.05s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Vertical connector line */}
          <div 
            style={{
              position: 'absolute',
              left: '42px',
              top: '0px',
              bottom: '24px',
              width: '1px',
              backgroundColor: 'var(--border-light)'
            }}
          />

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
              <div style={{ fontSize: 'var(--font-size-body-sm)', fontWeight: 600, color: 'var(--text-main)' }}>Personal Access Token</div>
              <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-muted)', marginTop: '1px' }}>Authenticate securely with the OmniEye API.</div>
            </div>
            <button 
              onClick={handleGenerateApiKey}
              style={{
                background: 'var(--warning)',
                color: 'var(--on-accent)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-caption)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.05s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b45309'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--warning)'}
            >
              Generate Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
