import { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, ChevronUp, SquarePen, Check, X, Shield, 
  Laptop, Monitor, Smartphone, 
  AlertTriangle, CheckCircle2, Camera, UserCog, ShieldCheck, KeyRound
} from 'lucide-react';
import johnDoeAvatar from '../../assets/john_doe_avatar.png';
import { ImageCropperModal } from '../GlobalSettings/ImageCropperModal';
import { TextField } from '../shared/TextField';
import { isValidPhone } from './phoneValidation';
import { isValidName } from './nameValidation';
import { isValidEmail } from './emailValidation';
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

interface UserProfile {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  department: string;
  organization: string;
  location: string;
  avatarUrl: string;
}

export function AccountSettings({
  setHasUnsavedChanges,
}: AccountSettingsProps) {
  // ----------------------------------------------------
  // State: Personal Information
  // ----------------------------------------------------
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('as_profile');
    if (saved) {
      try {
        return JSON.parse(saved) as UserProfile;
      } catch (e) {
        console.error('Failed to parse saved profile', e);
      }
    }
    return {
      fullName: 'Edwin Antony',
      jobTitle: 'UX/UI Designer',
      email: 'edwinantnony562@gmail.com',
      phone: '8606769614',
      department: 'Design',
      organization: 'Oominieye',
      location: 'India',
      avatarUrl: johnDoeAvatar
    };
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>({ ...profile });

  const handleStartEdit = () => {
    setTempProfile({ ...profile });
    setIsEditingProfile(true);
  };

  const phoneError = !isValidPhone(tempProfile.phone);
  const nameError = !isValidName(tempProfile.fullName);
  const emailError = !isValidEmail(tempProfile.email);
  const profileHasErrors = phoneError || nameError || emailError;

  const handleSaveProfile = () => {
    if (profileHasErrors) return;
    setProfile({ ...tempProfile });
    localStorage.setItem('as_profile', JSON.stringify(tempProfile));
    setIsEditingProfile(false);
    if (setHasUnsavedChanges) setHasUnsavedChanges(false);
  };

  const handleCancelEdit = () => {
    setTempProfile({ ...profile });
    setIsEditingProfile(false);
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
  };

  // ----------------------------------------------------
  // State & Handlers: Avatar Upload & Cropper
  // ----------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (avatarError) {
      const timer = setTimeout(() => setAvatarError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [avatarError]);

  const handleTriggerAvatarUpload = () => {
    setAvatarError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Format validation: Only PNG and JPG/JPEG allowed
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
    const ALLOWED_EXTS = ['.png', '.jpg', '.jpeg'];
    const isExtAllowed = ALLOWED_EXTS.some(ext => file.name.toLowerCase().endsWith(ext));
    const isTypeAllowed = ALLOWED_TYPES.includes(file.type.toLowerCase()) || isExtAllowed;

    if (!isTypeAllowed) {
      setAvatarError('Unsupported format. Please select a PNG or JPG image.');
      e.target.value = '';
      return;
    }

    // 2. File size validation: Maximum 5MB limit to prevent oversized image selection
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setAvatarError(`Image size exceeds ${MAX_SIZE_MB}MB. Please select a smaller image.`);
      e.target.value = '';
      return;
    }

    // 3. Dimension & Aspect ratio validation
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          // Minimum resolution guideline
          if (img.naturalWidth < 100 || img.naturalHeight < 100) {
            setAvatarError('Image is too small. Minimum resolution is 100x100 pixels.');
            return;
          }
          // Maximum resolution guideline (prevent oversized image canvas crashes)
          if (img.naturalWidth > 4096 || img.naturalHeight > 4096) {
            setAvatarError('Image resolution is oversized. Maximum allowed is 4096x4096 pixels.');
            return;
          }
          // Aspect ratio guideline (for profile avatar, prevent extreme aspect ratios like > 3:1 or < 1:3)
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio > 3 || ratio < 0.33) {
            setAvatarError('Image aspect ratio exceeds guidelines. Please select an image closer to 1:1 square.');
            return;
          }

          setAvatarError(null);
          setSelectedImageForCrop(dataUrl);
          setIsCropperOpen(true);
        };
        img.onerror = () => {
          setAvatarError('Failed to load image. Please select a valid PNG or JPG file.');
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmCroppedAvatar = (croppedDataUrl: string) => {
    setProfile(prev => {
      const updated = { ...prev, avatarUrl: croppedDataUrl };
      localStorage.setItem('as_profile', JSON.stringify(updated));
      return updated;
    });
    setTempProfile(prev => ({ ...prev, avatarUrl: croppedDataUrl }));
    setIsCropperOpen(false);
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };

  // ----------------------------------------------------
  // State: Preferences & Privacy
  // ----------------------------------------------------
  const [language, setLanguage] = useState(() => localStorage.getItem('as_language') || 'English');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('as_timezone') || '(GMT + 05:30) Asia/Kolkata');
  const [isCookieExpanded, setIsCookieExpanded] = useState(false);
  const [analyticsCookies, setAnalyticsCookies] = useState(() => {
    const saved = localStorage.getItem('as_analyticsCookies');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [marketingCookies, setMarketingCookies] = useState(() => {
    const saved = localStorage.getItem('as_marketingCookies');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    localStorage.setItem('as_language', val);
  };

  const handleTimezoneChange = (val: string) => {
    setTimezone(val);
    localStorage.setItem('as_timezone', val);
  };

  const handleToggleAnalyticsCookies = () => {
    const next = !analyticsCookies;
    setAnalyticsCookies(next);
    localStorage.setItem('as_analyticsCookies', JSON.stringify(next));
  };

  const handleToggleMarketingCookies = () => {
    const next = !marketingCookies;
    setMarketingCookies(next);
    localStorage.setItem('as_marketingCookies', JSON.stringify(next));
  };

  // ----------------------------------------------------
  // State: Security & Sessions
  // ----------------------------------------------------
  const [expandedSecurity, setExpandedSecurity] = useState<'sessions' | 'history' | 'advanced' | null>(null);
  const [is2faEnabled, setIs2faEnabled] = useState(() => {
    const saved = localStorage.getItem('as_2faEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleToggle2fa = (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !is2faEnabled;
    setIs2faEnabled(nextVal);
    localStorage.setItem('as_2faEnabled', JSON.stringify(nextVal));
  };

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

  // Sessions mockup
  const initialSessions = [
    { id: 1, device: 'MacBook Pro 16"', location: 'Bangalore, India', active: 'Active now', current: true, icon: Laptop },
    { id: 2, device: 'Windows Desktop', location: 'Delhi, India', active: '2 hours ago', current: false, icon: Monitor },
    { id: 3, device: 'iPhone 15 Pro', location: 'Mumbai, India', active: 'Yesterday', current: false, icon: Smartphone }
  ];

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('as_revoked_sessions');
    if (saved) {
      try {
        const revoked = JSON.parse(saved) as number[];
        return initialSessions.filter(s => !revoked.includes(s.id));
      } catch (e) {
        console.error('Failed to parse revoked sessions', e);
      }
    }
    return initialSessions;
  });

  const handleRevokeSession = (id: number) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      const saved = localStorage.getItem('as_revoked_sessions');
      const revoked = saved ? JSON.parse(saved) : [];
      localStorage.setItem('as_revoked_sessions', JSON.stringify([...revoked, id]));
      return updated;
    });
  };

  const toggleAccordion = (key: 'sessions' | 'history' | 'advanced') => {
    setExpandedSecurity(prev => prev === key ? null : key);
  };

  // Close security popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Clicks inside a dialog opened from these rows (2FA, password, delete) — including
      // its backdrop — are not "outside"; the row stays open behind the dialog.
      if (target.closest('.figma-modal-backdrop')) return;
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
      <div className="figma-settings-header page-title-group">
        <span className="page-title-icon" aria-hidden="true"><UserCog size={20} /></span>
        <h1 className="figma-settings-title brand-gradient-text">Account Settings</h1>
      </div>

      {/* Main Grid: Left Column (Personal Info & Preferences) + Right Column (Security & Notifications) */}
      <div className="figma-settings-grid">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="figma-column-left">

          {/* CARD 1: Personal Information */}
          <div className={`figma-card figma-card-personal ${isEditingProfile ? 'is-editing' : ''}`}>
            <div className="figma-card-top-bar">
              <h2 className="figma-card-heading"><span className="brand-gradient-text">Personal Information</span></h2>
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
                  accept="image/png, image/jpeg, image/jpg, .png, .jpg, .jpeg" 
                  style={{ display: 'none' }} 
                  onChange={handleFileSelect} 
                />
                {avatarError && (
                  <span 
                    className="figma-field-error"
                    style={{ 
                      textAlign: 'center', 
                      maxWidth: '220px', 
                      margin: '0 auto',
                      fontSize: '11px',
                      lineHeight: '1.3',
                      color: 'var(--danger, #ef4444)'
                    }}
                  >
                    {avatarError}
                  </span>
                )}
                <div className="figma-profile-labels">
                  {isEditingProfile ? (
                    <>
                      <input
                        type="text"
                        className="figma-edit-input figma-edit-name"
                        value={tempProfile.fullName}
                        onChange={e => handleProfileChange('fullName', e.target.value)}
                        aria-invalid={nameError}
                        style={nameError ? { borderColor: 'var(--danger)' } : undefined}
                      />
                      {nameError && (
                        <span className="figma-field-error">
                          Enter a valid full name (letters only, 2–60 characters)
                        </span>
                      )}
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

              {/* Right Input Fields Grid — fields stay mounted (disabled) outside edit
                  mode too, matching Figma's always-boxed look; only the disabled
                  attribute toggles when the pencil icon is used. */}
              <div className="figma-inputs-grid">
                <TextField
                  label="Email Address"
                  type="email"
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? tempProfile.email : profile.email}
                  onChange={e => handleProfileChange('email', e.target.value)}
                  error={isEditingProfile && emailError ? (tempProfile.email.trim() ? 'Enter a valid email address' : 'Email Address is required') : undefined}
                />

                <TextField
                  label="Phone"
                  type="tel"
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? tempProfile.phone : profile.phone}
                  onChange={e => handleProfileChange('phone', e.target.value)}
                  error={isEditingProfile && phoneError ? (tempProfile.phone.trim() ? 'Enter a valid phone number (7–15 digits, optional leading +)' : 'Phone number is required') : undefined}
                />

                <TextField
                  label="Department"
                  type="text"
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? tempProfile.department : profile.department}
                  onChange={e => handleProfileChange('department', e.target.value)}
                />

                <TextField
                  label="Organization"
                  type="text"
                  className="figma-input-org"
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? tempProfile.organization : profile.organization}
                  onChange={e => handleProfileChange('organization', e.target.value)}
                />
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
                    disabled={profileHasErrors}
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
                  <SquarePen size={18} />
                </button>
              )}
            </div>
          </div>


          {/* CARD 2: Preferences & Privacy */}
          <div className="figma-card figma-card-preferences">
            <div className="figma-card-top-bar">
              <h2 className="figma-card-heading"><span className="brand-gradient-text">Preferences & Privacy</span></h2>
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
                        onClick={handleToggleAnalyticsCookies}
                      >
                        <span className="figma-toggle-thumb" />
                      </button>
                    </div>
                    <div className="figma-toggle-subrow">
                      <span>Marketing & Targeting Cookies</span>
                      <button 
                        type="button"
                        className={`figma-mini-toggle ${marketingCookies ? 'active' : ''}`}
                        onClick={handleToggleMarketingCookies}
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
                  onChange={handleLanguageChange}
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
                  onChange={handleTimezoneChange}
                  options={[
                    { label: '(GMT + 05:30) Asia', value: '(GMT + 05:30) Asia/Kolkata' },
                    { label: '(UTC) London / GMT', value: '(UTC) GMT Standard Time' },
                    { label: '(EST) New York', value: '(EST) Eastern Time' },
                    { label: '(PST) Los Angeles', value: '(PST) Pacific Time' },
                    { label: '(SGT) Singapore', value: '(SGT) Singapore Time' }
                  ]}
                />
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
              <h2 className="figma-card-heading"><span className="brand-gradient-text">Security & Sessions</span></h2>

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

                {/* Advanced Settings — expands inline within this card */}
                <div className="figma-sec-accordion">
                  <button
                    type="button"
                    className="figma-sec-trigger"
                    aria-expanded={expandedSecurity === 'advanced'}
                    onClick={() => toggleAccordion('advanced')}
                  >
                    <span>Advanced Settings</span>
                    {expandedSecurity === 'advanced' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {expandedSecurity === 'advanced' && (
                    <div className="figma-sec-inline-content">
                      <div className="figma-security-buttons-row">
                        <button 
                          type="button" 
                          className={`figma-btn-outline ${is2faEnabled ? 'active-2fa' : ''}`}
                          onClick={() => {
                            if (is2faEnabled) {
                              handleToggle2fa(false);
                            } else {
                              setIs2faModalOpen(true);
                            }
                          }}
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
                          Change Password
                        </button>
                        <button
                          type="button"
                          className="figma-btn-delete-red"
                          onClick={() => setIsDeleteModalOpen(true)}
                        >
                          Delete your account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom row, pinned to the card bottom: legal & data links left, location right */}
            <div className="figma-security-footer">
              <div className="figma-privacy-links">
                <a href="#privacy" className="figma-privacy-link" onClick={e => e.preventDefault()}>Privacy policy</a>
                <span className="figma-dot">•</span>
                <a href="#terms" className="figma-privacy-link" onClick={e => e.preventDefault()}>Terms of service</a>
                <span className="figma-dot">•</span>
                <a href="#export" className="figma-privacy-link" onClick={e => e.preventDefault()}>Export Personal Data</a>
              </div>
              <span className="figma-location-text">{profile.location}</span>
            </div>


          </div>

        </div>

      </div>


      {/* ================= MODALS ================= */}

      {/* 2FA Modal */}
      {is2faModalOpen && (
        <div className="figma-modal-backdrop" onClick={() => setIs2faModalOpen(false)}>
          <div className="figma-modal-box figma-modal-std" role="dialog" aria-modal="true" aria-labelledby="twofa-title" onClick={e => e.stopPropagation()}>
            <div className="figma-modal-header">
              <div className="page-title-group">
                <span className="page-title-icon" aria-hidden="true"><ShieldCheck size={18} /></span>
                <h3 id="twofa-title"><span className="brand-gradient-text">Two-Factor Authentication (2FA)</span></h3>
              </div>
              <button className="figma-modal-close" aria-label="Close" title="Close" onClick={() => setIs2faModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="figma-modal-body">
              <p className="figma-modal-desc">Scan the QR code with your authenticator app (Google Authenticator, Authy, or 1Password) to enable 2FA protection.</p>
              
              <div className="figma-qr-placeholder">
                <div className="figma-qr-code-box">
                  <Shield size={48} color="var(--primary)" />
                  <span>[ QR Code ]</span>
                </div>
              </div>

              <div className="figma-modal-field">
                <TextField
                  label="6-Digit Code"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
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
                  handleToggle2fa(!is2faEnabled);
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
          <div className="figma-modal-box figma-modal-std" role="dialog" aria-modal="true" aria-labelledby="password-title" onClick={e => e.stopPropagation()}>
            <div className="figma-modal-header">
              <div className="page-title-group">
                <span className="page-title-icon" aria-hidden="true"><KeyRound size={18} /></span>
                <h3 id="password-title"><span className="brand-gradient-text">Change Password</span></h3>
              </div>
              <button className="figma-modal-close" aria-label="Close" title="Close" onClick={closePasswordModal}><X size={16} /></button>
            </div>
            <div className="figma-modal-body">
              {passSuccess ? (
                <div className="figma-success-state">
                  <CheckCircle2 size={42} color="var(--success, #10b981)" />
                  <p>Password updated successfully!</p>
                </div>
              ) : (
                <>
                  <div className="figma-modal-field">
                    <TextField
                      label="Current Password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={passForm.current}
                      onChange={e => { setPassForm({...passForm, current: e.target.value}); setPassError(''); }}
                    />
                  </div>
                  <div className="figma-modal-field">
                    <TextField
                      label="New Password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={passForm.next}
                      onChange={e => { setPassForm({...passForm, next: e.target.value}); setPassError(''); }}
                    />
                  </div>
                  <div className="figma-modal-field">
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      autoComplete="new-password"
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
          <div className="figma-modal-box figma-modal-std figma-modal-danger" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" onClick={e => e.stopPropagation()}>
            <div className="figma-modal-header">
              <div className="page-title-group">
                <span className="page-title-icon page-title-icon--danger" aria-hidden="true"><AlertTriangle size={18} /></span>
                <h3 id="delete-title" className="figma-danger-heading">Delete Account</h3>
              </div>
              <button className="figma-modal-close" aria-label="Close" title="Close" onClick={() => setIsDeleteModalOpen(false)}><X size={16} /></button>
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
