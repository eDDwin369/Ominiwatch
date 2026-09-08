import { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, ChevronUp, Pencil, Check, X, Shield, 
  Laptop, Monitor, Smartphone, 
  AlertTriangle, CheckCircle2, Camera
} from 'lucide-react';
import johnDoeAvatar from '../../assets/john_doe_avatar.png';
import { ImageCropperModal } from '../GlobalSettings/ImageCropperModal';
import { isValidPhone } from './phoneValidation';
import './AccountSettings.css';

interface AccountSettingsProps {
  hasUnsavedChanges?: boolean;
  setHasUnsavedChanges?: (value: boolean) => void;
  editProfileOnLoad?: boolean;
  setEditProfileOnLoad?: (value: boolean) => void;
  initialTab?: string;
}

interface CustomSmoothDropdownProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  className?: string;
}

function CustomSmoothDropdown({ value, options, onChange, className = '' }: CustomSmoothDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`figma-smooth-dropdown ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        className={`figma-smooth-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label || value}</span>
        <ChevronDown size={14} className={`figma-smooth-arrow ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="figma-smooth-dropdown-menu">
          {options.map((opt) => (
            <div 
              key={opt.value}
              className={`figma-smooth-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={14} className="figma-option-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AccountSettings({
  setHasUnsavedChanges,
}: AccountSettingsProps) {
  // ----------------------------------------------------
  // State: Personal Information
  // ----------------------------------------------------
  const [profile, setProfile] = useState({
    fullName: 'Edwin Antony',
    jobTitle: 'UX/UI Designer',
    email: 'edwin.antony@omnieye.com',
    phone: '+91 98765 43210',
    department: 'UI/UX Design',
    organization: 'OomniEye',
    location: 'India',
    avatarUrl: johnDoeAvatar
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...profile });

  const handleStartEdit = () => {
    setTempProfile({ ...profile });
    setIsEditingProfile(true);
  };

  const phoneError = !isValidPhone(tempProfile.phone);

  const handleSaveProfile = () => {
    if (phoneError) return;
    setProfile({ ...tempProfile });
    setIsEditingProfile(false);
    if (setHasUnsavedChanges) setHasUnsavedChanges(false);
  };

  const handleCancelEdit = () => {
    setTempProfile({ ...profile });
    setIsEditingProfile(false);
  };

  const handleProfileChange = (field: keyof typeof tempProfile, value: string) => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // ----------------------------------------------------
  // State & Handlers: Avatar Upload & Cropper
  // ----------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);

  const handleTriggerAvatarUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImageForCrop(reader.result);
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleConfirmCroppedAvatar = (croppedDataUrl: string) => {
    setProfile(prev => ({ ...prev, avatarUrl: croppedDataUrl }));
    setTempProfile(prev => ({ ...prev, avatarUrl: croppedDataUrl }));
    setIsCropperOpen(false);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };

  // ----------------------------------------------------
  // State: Preferences & Privacy
  // ----------------------------------------------------
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('(GMT + 05:30) Asia/Kolkata');
  const [isCookieExpanded, setIsCookieExpanded] = useState(false);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(false);

  // ----------------------------------------------------
  // State: Security & Sessions
  // ----------------------------------------------------
  const [expandedSecurity, setExpandedSecurity] = useState<'sessions' | 'history' | null>(null);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states for password modal
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPassForm({ current: '', next: '', confirm: '' });
    setPassError('');
    setPassSuccess(false);
  };

  const submitPasswordChange = () => {
    const { current, next, confirm } = passForm;
    if (!current || !next || !confirm) {
      setPassError('All fields are required.');
      return;
    }
    if (next.length < 8) {
      setPassError('New password must be at least 8 characters.');
      return;
    }
    if (next === current) {
      setPassError('New password must be different from the current password.');
      return;
    }
    if (next !== confirm) {
      setPassError('New password and confirmation do not match.');
      return;
    }
    setPassError('');
    setPassSuccess(true);
    setTimeout(closePasswordModal, 1500);
  };

  // 2FA code input
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // ----------------------------------------------------
  // State: Notifications
  // ----------------------------------------------------
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationCount, setNotificationCount] = useState('5');

  // Sessions mockup
  const [sessions, setSessions] = useState([
    { id: 1, device: 'MacBook Pro 16"', location: 'Bangalore, India', active: 'Active now', current: true, icon: Laptop },
    { id: 2, device: 'Windows Desktop', location: 'Delhi, India', active: '2 hours ago', current: false, icon: Monitor },
    { id: 3, device: 'iPhone 15 Pro', location: 'Mumbai, India', active: 'Yesterday', current: false, icon: Smartphone }
  ]);

  const handleRevokeSession = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const toggleAccordion = (key: 'sessions' | 'history') => {
    setExpandedSecurity(prev => prev === key ? null : key);
  };

  // Close security popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (expandedSecurity && !target.closest('.figma-sec-accordion')) {
        setExpandedSecurity(null);
      }
      if (isCookieExpanded && !target.closest('.figma-pref-row-accordion')) {
        setIsCookieExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedSecurity, isCookieExpanded]);

  return (
    <div className="figma-account-settings-page-wrapper">
      <div className="figma-account-settings-container">
        {/* Top Header / Breadcrumb */}
      <div className="figma-settings-header">
        <h1 className="figma-settings-title">Account Settings</h1>
      </div>

      {/* Main Grid: Left Column (Personal Info & Preferences) + Right Column (Security & Notifications) */}
      <div className="figma-settings-grid">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="figma-column-left">

          {/* CARD 1: Personal Information */}
          <div className="figma-card figma-card-personal">
            <div className="figma-card-top-bar">
              <h2 className="figma-card-heading">Personal Information</h2>
              <div className="figma-location-text">
                <span>{profile.location} .</span>
              </div>
            </div>

            <div className="figma-personal-content">
              {/* Left Profile Avatar & Name */}
              <div className="figma-profile-meta">
                <div 
                  className="figma-avatar-wrapper" 
                  onClick={handleTriggerAvatarUpload}
                  title="Click to change profile picture"
                >
                  <img src={profile.avatarUrl} alt={profile.fullName} className="figma-avatar-img" />
                  <div className="figma-avatar-hover-overlay">
                    <Camera size={18} className="figma-camera-icon" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleFileSelect} 
                />
                <div className="figma-profile-labels">
                  {isEditingProfile ? (
                    <>
                      <input 
                        type="text" 
                        className="figma-edit-input figma-edit-name"
                        value={tempProfile.fullName}
                        onChange={e => handleProfileChange('fullName', e.target.value)}
                      />
                      <input 
                        type="text" 
                        className="figma-edit-input figma-edit-role"
                        value={tempProfile.jobTitle}
                        onChange={e => handleProfileChange('jobTitle', e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <h3 className="figma-user-name">{profile.fullName}</h3>
                      <p className="figma-user-role">{profile.jobTitle}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Right Input Fields Grid */}
              <div className="figma-inputs-grid">
                <div className="figma-input-field">
                  <label className="figma-input-label">Email</label>
                  {isEditingProfile ? (
                    <input 
                      type="email" 
                      className="figma-underline-input"
                      value={tempProfile.email}
                      onChange={e => handleProfileChange('email', e.target.value)}
                    />
                  ) : (
                    <div className="figma-underline-value">{profile.email}</div>
                  )}
                </div>

                <div className="figma-input-field">
                  <label className="figma-input-label">Phone</label>
                  {isEditingProfile ? (
                    <>
                      <input
                        type="tel"
                        className="figma-underline-input"
                        value={tempProfile.phone}
                        onChange={e => handleProfileChange('phone', e.target.value)}
                        aria-invalid={phoneError}
                        style={phoneError ? { borderColor: 'var(--danger)' } : undefined}
                      />
                      {phoneError && (
                        <span style={{ color: 'var(--danger)', fontSize: '11px' }}>
                          Enter a valid phone number
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="figma-underline-value">{profile.phone}</div>
                  )}
                </div>

                <div className="figma-input-field">
                  <label className="figma-input-label">Department</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      className="figma-underline-input"
                      value={tempProfile.department}
                      onChange={e => handleProfileChange('department', e.target.value)}
                    />
                  ) : (
                    <div className="figma-underline-value">{profile.department}</div>
                  )}
                </div>

                <div className="figma-input-field figma-input-org">
                  <label className="figma-input-label">Organization</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      className="figma-underline-input"
                      value={tempProfile.organization}
                      onChange={e => handleProfileChange('organization', e.target.value)}
                    />
                  ) : (
                    <div className="figma-underline-value">{profile.organization}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Right Edit / Save Button */}
            <div className="figma-card-action-bottom-right">
              {isEditingProfile ? (
                <div className="figma-edit-actions">
                  <button 
                    type="button" 
                    className="figma-btn-icon figma-btn-cancel" 
                    onClick={handleCancelEdit}
                    title="Cancel changes"
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    className="figma-btn-icon figma-btn-save"
                    onClick={handleSaveProfile}
                    disabled={phoneError}
                    title="Save profile"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="figma-btn-edit-square" 
                  onClick={handleStartEdit}
                  title="Edit Information"
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
          </div>


          {/* CARD 2: Preferences & Privacy */}
          <div className="figma-card figma-card-preferences">
            <div className="figma-card-top-bar">
              <h2 className="figma-card-heading">Preferences & Privacy</h2>
              <div className="figma-privacy-links">
                <a href="#privacy" className="figma-privacy-link" onClick={e => e.preventDefault()}>Privacy policy</a>
                <span className="figma-dot">•</span>
                <a href="#terms" className="figma-privacy-link" onClick={e => e.preventDefault()}>Terms of service</a>
                <span className="figma-dot">•</span>
                <a href="#export" className="figma-privacy-link" onClick={e => e.preventDefault()}>Export Personal Data</a>
              </div>
            </div>

            <div className="figma-preferences-row-inline">
              {/* Item 1: Cookie Preferences */}
              <div className="figma-pref-cookie-wrap">
                <button 
                  type="button" 
                  className="figma-cookie-trigger"
                  onClick={() => setIsCookieExpanded(!isCookieExpanded)}
                >
                  <span>Cookie Preferences</span>
                  {isCookieExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isCookieExpanded && (
                  <div className="figma-cookie-details-panel">
                    <div className="figma-toggle-subrow">
                      <span>Analytics Cookies</span>
                      <button 
                        type="button"
                        className={`figma-mini-toggle ${analyticsCookies ? 'active' : ''}`}
                        onClick={() => setAnalyticsCookies(!analyticsCookies)}
                      >
                        <span className="figma-toggle-thumb" />
                      </button>
                    </div>
                    <div className="figma-toggle-subrow">
                      <span>Marketing & Targeting Cookies</span>
                      <button 
                        type="button"
                        className={`figma-mini-toggle ${marketingCookies ? 'active' : ''}`}
                        onClick={() => setMarketingCookies(!marketingCookies)}
                      >
                        <span className="figma-toggle-thumb" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Item 2: Language */}
              <div className="figma-select-inline-item">
                <span className="figma-select-label">Language</span>
                <CustomSmoothDropdown 
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { label: 'English', value: 'English' },
                    { label: 'Spanish', value: 'Spanish' },
                    { label: 'French', value: 'French' },
                    { label: 'German', value: 'German' },
                    { label: 'Hindi', value: 'Hindi' }
                  ]}
                />
              </div>

              {/* Item 3: Timezone */}
              <div className="figma-select-inline-item">
                <span className="figma-select-label">Timezone</span>
                <CustomSmoothDropdown 
                  value={timezone}
                  onChange={setTimezone}
                  options={[
                    { label: '(GMT + 05:30) Asia', value: '(GMT + 05:30) Asia/Kolkata' },
                    { label: '(UTC) London / GMT', value: '(UTC) GMT Standard Time' },
                    { label: '(EST) New York', value: '(EST) Eastern Time' },
                    { label: '(PST) Los Angeles', value: '(PST) Pacific Time' },
                    { label: '(SGT) Singapore', value: '(SGT) Singapore Time' }
                  ]}
                />
              </div>

              {/* Item 4: Delete Account Button */}
              <div className="figma-delete-btn-wrap">
                <button 
                  type="button" 
                  className="figma-btn-delete-red"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete your account
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="figma-column-right">

          {/* CARD 3: Single Unified Card (Security & Sessions + Notifications) */}
          <div className="figma-card figma-card-unified-right">
            
            {/* Top Section: Security & Sessions */}
            <div className="figma-security-section">
              <h2 className="figma-card-heading">Security & Sessions</h2>

              <div className="figma-accordions-stack">
                {/* Active Sessions Item */}
                <div className="figma-sec-accordion">
                  <button 
                    type="button" 
                    className="figma-sec-trigger"
                    onClick={() => toggleAccordion('sessions')}
                  >
                    <span>Active Sessions</span>
                    {expandedSecurity === 'sessions' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {expandedSecurity === 'sessions' && (
                    <div className="figma-sec-dropdown-content">
                      {sessions.map(s => {
                        const IconComp = s.icon;
                        return (
                          <div key={s.id} className="figma-session-item">
                            <div className="figma-session-icon">
                              <IconComp size={16} />
                            </div>
                            <div className="figma-session-info">
                              <span className="figma-session-device">{s.device} {s.current && <span className="figma-badge-current">This device</span>}</span>
                              <span className="figma-session-sub">{s.location} • {s.active}</span>
                            </div>
                            {!s.current && (
                              <button 
                                type="button" 
                                className="figma-session-revoke"
                                onClick={() => handleRevokeSession(s.id)}
                              >
                                End
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Login History Item */}
                <div className="figma-sec-accordion">
                  <button 
                    type="button" 
                    className="figma-sec-trigger"
                    onClick={() => toggleAccordion('history')}
                  >
                    <span>Login History</span>
                    {expandedSecurity === 'history' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {expandedSecurity === 'history' && (
                    <div className="figma-sec-dropdown-content">
                      <div className="figma-history-log">
                        <div className="figma-log-row">
                          <span className="figma-log-time">Today, 09:42 AM</span>
                          <span className="figma-log-status figma-status-ok">Success (103.21.244.1)</span>
                        </div>
                        <div className="figma-log-row">
                          <span className="figma-log-time">Yesterday, 14:15 PM</span>
                          <span className="figma-log-status figma-status-ok">Success (103.21.244.1)</span>
                        </div>
                        <div className="figma-log-row">
                          <span className="figma-log-time">14 Aug, 11:05 AM</span>
                          <span className="figma-log-status figma-status-warn">Failed Attempt</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Outline Pill Buttons */}
              <div className="figma-security-buttons-row">
                <button 
                  type="button" 
                  className={`figma-btn-outline ${is2faEnabled ? 'active-2fa' : ''}`}
                  onClick={() => setIs2faModalOpen(true)}
                >
                  {is2faEnabled ? '2FA Enabled' : 'Enable 2FA'}
                </button>
                
                <button 
                  type="button" 
                  className="figma-btn-outline"
                  onClick={() => {
                    setPassForm({ current: '', next: '', confirm: '' });
                    setPassSuccess(false);
                    setIsPasswordModalOpen(true);
                  }}
                >
                  change Password
                </button>
              </div>
            </div>

            {/* Horizontal Divider Line */}
            <div className="figma-card-divider" />

            {/* Bottom Section: Notifications */}
            <div className="figma-notifications-section">
              <div className="figma-notif-header">
                <h2 className="figma-card-heading">Notifications</h2>
                {/* Purple Toggle Switch */}
                <button 
                  type="button"
                  className={`figma-main-toggle ${notificationsEnabled ? 'on' : 'off'}`}
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  <span className="figma-main-toggle-thumb" />
                </button>
              </div>

              {/* Notification Dropdown Row */}
              <div className="figma-notif-row">
                <span className="figma-notif-label">Notification Dropdown</span>
                <CustomSmoothDropdown 
                  value={notificationCount}
                  onChange={setNotificationCount}
                  className="figma-dropdown-compact"
                  options={[
                    { label: '5', value: '5' },
                    { label: '10', value: '10' },
                    { label: '15', value: '15' },
                    { label: '20', value: '20' }
                  ]}
                />
              </div>
            </div>

          </div>

        </div>

      </div>


      {/* ================= MODALS ================= */}

      {/* 2FA Modal */}
      {is2faModalOpen && (
        <div className="figma-modal-backdrop" onClick={() => setIs2faModalOpen(false)}>
          <div className="figma-modal-box" onClick={e => e.stopPropagation()}>
            <div className="figma-modal-header">
              <h3>Two-Factor Authentication (2FA)</h3>
              <button className="figma-modal-close" onClick={() => setIs2faModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="figma-modal-body">
              <p className="figma-modal-desc">Scan the QR code with your authenticator app (Google Authenticator, Authy, or 1Password) to enable 2FA protection.</p>
              
              <div className="figma-qr-placeholder">
                <div className="figma-qr-code-box">
                  <Shield size={48} color="#3b82f6" />
                  <span>[ QR Code ]</span>
                </div>
              </div>

              <div className="figma-input-field">
                <label className="figma-input-label">Enter 6-Digit Code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="123456"
                  className="figma-modal-input"
                  value={twoFactorCode}
                  onChange={e => setTwoFactorCode(e.target.value)}
                />
              </div>
            </div>
            <div className="figma-modal-footer">
              <button className="figma-btn-modal-cancel" onClick={() => setIs2faModalOpen(false)}>Cancel</button>
              <button 
                className="figma-btn-modal-confirm"
                onClick={() => {
                  setIs2faEnabled(!is2faEnabled);
                  setIs2faModalOpen(false);
                }}
              >
                {is2faEnabled ? 'Disable 2FA' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="figma-modal-backdrop" onClick={closePasswordModal}>
          <div className="figma-modal-box" onClick={e => e.stopPropagation()}>
            <div className="figma-modal-header">
              <h3>Change Password</h3>
              <button className="figma-modal-close" onClick={closePasswordModal}><X size={18} /></button>
            </div>
            <div className="figma-modal-body">
              {passSuccess ? (
                <div className="figma-success-state">
                  <CheckCircle2 size={42} color="#10b981" />
                  <p>Password updated successfully!</p>
                </div>
              ) : (
                <>
                  <div className="figma-modal-field">
                    <label className="figma-input-label">Current Password</label>
                    <input
                      type="password"
                      className="figma-modal-input"
                      placeholder="••••••••"
                      value={passForm.current}
                      onChange={e => { setPassForm({...passForm, current: e.target.value}); setPassError(''); }}
                    />
                  </div>
                  <div className="figma-modal-field">
                    <label className="figma-input-label">New Password</label>
                    <input
                      type="password"
                      className="figma-modal-input"
                      placeholder="••••••••"
                      value={passForm.next}
                      onChange={e => { setPassForm({...passForm, next: e.target.value}); setPassError(''); }}
                    />
                  </div>
                  <div className="figma-modal-field">
                    <label className="figma-input-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="figma-modal-input"
                      placeholder="••••••••"
                      value={passForm.confirm}
                      onChange={e => { setPassForm({...passForm, confirm: e.target.value}); setPassError(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') submitPasswordChange(); }}
                    />
                  </div>
                  {passError && (
                    <p className="figma-modal-error" role="alert">{passError}</p>
                  )}
                </>
              )}
            </div>
            <div className="figma-modal-footer">
              <button className="figma-btn-modal-cancel" onClick={closePasswordModal}>Close</button>
              {!passSuccess && (
                <button
                  className="figma-btn-modal-confirm"
                  onClick={submitPasswordChange}
                >
                  Save Password
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="figma-modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="figma-modal-box figma-modal-danger" onClick={e => e.stopPropagation()}>
            <div className="figma-modal-header">
              <div className="figma-danger-title">
                <AlertTriangle size={20} color="#ef4444" />
                <h3>Delete Account</h3>
              </div>
              <button className="figma-modal-close" onClick={() => setIsDeleteModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="figma-modal-body">
              <p className="figma-modal-desc">This action is permanent and cannot be undone. All your personal data, preferences, and session history will be completely erased.</p>
            </div>
            <div className="figma-modal-footer">
              <button className="figma-btn-modal-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button 
                className="figma-btn-modal-danger"
                onClick={() => {
                  alert("Account deletion request submitted.");
                  setIsDeleteModalOpen(false);
                }}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {isCropperOpen && selectedImageForCrop && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          onConfirm={handleConfirmCroppedAvatar}
          imageUrl={selectedImageForCrop}
          title="Adjust profile image"
          subtitle="Drag and zoom to fit your profile picture inside the bright frame. Anything in the dimmed area is cropped out."
          cropShape="round"
          cropWidth={180}
          cropHeight={180}
        />
      )}

    </div>
    </div>
  );
}
