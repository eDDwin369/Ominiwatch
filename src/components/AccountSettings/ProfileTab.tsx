import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Phone, Mail, Pencil, Camera, 
  Layers, CheckCircle2, Lock, Unlock, User, Briefcase, Calendar, Clock
} from 'lucide-react';
import johnDoeAvatar from '../../assets/john_doe_avatar.png';
import { isValidPhone } from './phoneValidation';
import { useThemeStore } from 'omnieye-theme-studio';
import './ProfileStyles.css';

interface ProfileTabProps {
  setHasUnsavedChanges?: (value: boolean) => void;
  editProfileOnLoad?: boolean;
  setEditProfileOnLoad?: (value: boolean) => void;
}

export function ProfileTab({ 
  setHasUnsavedChanges,
  editProfileOnLoad,
  setEditProfileOnLoad
}: ProfileTabProps) {
  // 1. Initial State (Prefilled to match the screenshot exactly)
  const initialData = {
    fullName: 'Edwin Antony',
    jobTitle: 'UI/UX Designer',
    department: 'Product Design',
    organization: 'OomniEye Digital Twin Solutions',
    location: 'India',
    phone: '+91 98765 43210',
    email: 'edwin.antony@omnieye.com',
    employeeId: 'EMP-1024',
    memberSince: 'Jan 15, 2024'
  };

  const [formData, setFormData] = useState(initialData);
  const [tempFormData, setTempFormData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);

  // Trigger editing mode automatically if editProfileOnLoad is passed from the Header profile action
  useEffect(() => {
    if (editProfileOnLoad) {
      setIsEditing(true);
      if (setEditProfileOnLoad) setEditProfileOnLoad(false); // Clear transition signal
    }
  }, [editProfileOnLoad, setEditProfileOnLoad]);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<any>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);

  // Field locking state (simulation for lock icon)
  const [lockedFields, setLockedFields] = useState({
    email: true,
    organization: true,
    department: true,
    jobTitle: true,
    employeeId: true
  });

  const [avatarUrl, setAvatarUrl] = useState<string>(johnDoeAvatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  // Check for unsaved changes (dirty state)
  useEffect(() => {
    if (isEditing) {
      const dirty = tempFormData.fullName !== formData.fullName ||
        tempFormData.jobTitle !== formData.jobTitle ||
        tempFormData.department !== formData.department ||
        tempFormData.organization !== formData.organization ||
        tempFormData.location !== formData.location ||
        tempFormData.phone !== formData.phone ||
        tempFormData.email !== formData.email ||
        tempFormData.employeeId !== formData.employeeId;
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(dirty);
      }
    } else {
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
      }
    }
  }, [tempFormData, formData, isEditing, setHasUnsavedChanges]);

  // Form handler functions
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempFormData({
      ...tempFormData,
      [e.target.name]: e.target.value
    });
  };

  const toggleLock = (field: keyof typeof lockedFields) => {
    setLockedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleEditClick = () => {
    setTempFormData(formData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempFormData(formData);
    setIsEditing(false);
  };

  const phoneError = !isValidPhone(tempFormData.phone);

  const handleSave = () => {
    if (phoneError) return;
    setIsSaving(true);
    setTimeout(() => {
      setFormData(tempFormData);
      setIsSaving(false);
      setIsEditing(false);
      setShowToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      const st = useThemeStore.getState().settings;
      const durMs = (st.autoDismissSec > 0 ? st.autoDismissSec : 8) * 1000;
      toastTimeoutRef.current = setTimeout(() => setShowToast(false), durMs);
    }, 800);
  };

  // Completion score calculation
  const getCompletionData = () => {
    const fields = [
      { key: 'fullName', label: 'Full name', value: formData.fullName },
      { key: 'jobTitle', label: 'Job title', value: formData.jobTitle },
      { key: 'department', label: 'Department', value: formData.department },
      { key: 'organization', label: 'Organization', value: formData.organization },
      { key: 'location', label: 'Location', value: formData.location },
      { key: 'phone', label: 'Phone', value: formData.phone },
      { key: 'email', label: 'Email', value: formData.email },
      { key: 'employeeId', label: 'Employee ID', value: formData.employeeId }
    ];

    const missing = fields.filter(f => !f.value || f.value.trim() === '');
    const filledCount = fields.length - missing.length;
    const percent = Math.round((filledCount / fields.length) * 100);

    return {
      percent,
      missing
    };
  };

  const { missing } = getCompletionData();
  const percent: number = 70; // Changed 100% to 70% as requested

  // If percent is hardcoded to 70%, prefill lacking list with demo items if missing is empty
  const missingItems = missing.length > 0 ? missing : [
    { key: 'phone', label: 'phone number' },
    { key: 'location', label: 'location' }
  ];

  // SVG ring variables
  const strokeWidth = 5;
  const radius = 62;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Rule colors: 100% green, <70 yellow, <40 red
  const getProgressColor = (pct: number) => {
    if (pct === 100) return 'var(--success)'; // Green (100% only)
    if (pct < 40) return 'var(--danger)'; // Red
    return 'var(--warning)'; // Yellow (includes 70%)
  };
  const progressColor = getProgressColor(percent);

  return (
    <div className="profile-redesign-container">
      {/* Toast Alert */}
      {showToast && (
        <div className="toast-success">
          <CheckCircle2 size={16} /> Profile updated successfully.
        </div>
      )}

      {!isEditing ? (
        /* READ-ONLY THREE-COLUMN GRID VIEW WITH CUSTOM HEADERS */
        <div className="profile-cards-grid">
          {/* Card 1: Profile Completeness */}
          <div className="account-profile-header-card" style={{ justifyContent: 'space-between' }}>
            {/* Wavy Purple Background Decoration */}
            <div className="profile-card-decor-container">
              <svg className="profile-card-decor-svg" viewBox="0 0 300 300" preserveAspectRatio="none">
                <path d="M0,0 L260,0 C220,120 120,160 0,220 Z" fill="rgba(124, 58, 237, 0.05)" />
                <path d="M0,0 L180,0 C150,90 90,110 0,160 Z" fill="rgba(124, 58, 237, 0.08)" />
              </svg>
            </div>

            <div className="card-vertical-stack" style={{ alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
              {/* Progress Ring wrapping the Profile Avatar */}
              <div className="profile-avatar-wrapper" style={{ margin: '16px 0 0 0', width: '150px', height: '150px', position: 'relative' }}>
                <svg height="150" width="150" className="progress-ring" style={{ transform: 'rotate(-90deg)' }}>
                  <circle className="progress-ring-bg" stroke="var(--border-light, var(--border-light))" fill="transparent" strokeWidth={strokeWidth} r={radius} cx="75" cy="75" />
                  <circle className="progress-ring-circle" stroke={progressColor} fill="transparent" strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" r={radius} cx="75" cy="75" style={{ stroke: progressColor }} />
                </svg>

                {/* Profile Image container placed inside the progress ring */}
                <div 
                  onClick={triggerFileSelect}
                  onMouseEnter={() => setIsAvatarHovered(true)}
                  onMouseLeave={() => setIsAvatarHovered(false)}
                  style={{
                    position: 'absolute',
                    top: '13px',
                    left: '13px',
                    width: '124px',
                    height: '124px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  title="Upload image from desktop"
                >
                  <img src={avatarUrl} alt={formData.fullName} className="profile-avatar-img" />
                  
                  {/* Camera Hover overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    opacity: isAvatarHovered ? 1 : 0,
                    transition: 'opacity 0.05s ease',
                  }}>
                    <Camera size={26} />
                  </div>
                </div>

                {/* 70% Complete Badge positioned above the progress ring bottom center */}
                <div 
                  className="profile-progress-pill"
                  style={{ 
                    color: percent === 100 ? 'var(--success)' : progressColor, 
                    backgroundColor: percent === 100 ? '#ecfdf5' : progressColor + '12',
                    fontSize: '12px',
                    padding: '4px 12px',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    border: '1px solid ' + (percent === 100 ? 'var(--success)' : progressColor) + '30',
                    cursor: 'pointer'
                  }}
                >
                  {percent}% Complete
                  <div className="profile-tooltip-box">
                    <div className="profile-tooltip-title">Profile incomplete ({percent}%)</div>
                    <div className="profile-tooltip-list">
                      {missingItems.map(item => (
                        <div key={item.key} className="profile-tooltip-item">• {item.label} not added</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden Input file selection */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />

              {/* Name Edwin Antony below uploader avatar circle */}
              <div style={{ zIndex: 1, textAlign: 'center', marginTop: '16px' }}>
                <h1 className="header-profile-title" style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '22px' }}>
                  {formData.fullName}
                </h1>
                <p className="header-profile-job-purple" style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: '500' }}>{formData.jobTitle}</p>
              </div>
            </div>

            <button className="header-profile-edit-btn-pill" onClick={handleEditClick} style={{ width: '100%', alignSelf: 'center', justifyContent: 'center', marginTop: '16px', zIndex: 2 }}>
              <Pencil size={14} /> Edit Profile
            </button>
          </div>

          {/* Card 2: Personal Information */}
          <div className="account-profile-header-card" style={{ justifyContent: 'flex-start' }}>
            <div style={{ width: '100%' }}>
              <h2 className="card-title-header">Personal Information</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><User size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Name</span>
                    <span className="meta-text-value">
                      {formData.fullName}
                    </span>
                  </div>
                </div>

                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><Phone size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Phone</span>
                    <span className="meta-text-value">{formData.phone}</span>
                  </div>
                </div>

                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><Mail size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Email</span>
                    <span className="meta-text-value">{formData.email}</span>
                  </div>
                </div>

                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><Layers size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Organization</span>
                    <span className="meta-text-value">{formData.organization}</span>
                  </div>
                </div>

                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><Layers size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Department</span>
                    <span className="meta-text-value">{formData.department}</span>
                  </div>
                </div>

                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><Briefcase size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Job Title</span>
                    <span className="meta-text-value">{formData.jobTitle}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Account Informations */}
          <div className="account-profile-header-card" style={{ justifyContent: 'flex-start' }}>
            <div style={{ width: '100%' }}>
              <h2 className="card-title-header">Account Informations</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><Calendar size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Member Since</span>
                    <span className="meta-text-value">{formData.memberSince}</span>
                  </div>
                </div>

                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><Clock size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Last Updated</span>
                    <span className="meta-text-value">Today, 10:30 AM</span>
                  </div>
                </div>

                <div className="header-meta-item-box">
                  <div className="meta-icon-square"><MapPin size={16} /></div>
                  <div className="meta-text-block">
                    <span className="meta-text-label">Region</span>
                    <span className="meta-text-value">{formData.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EDITABLE THREE-COLUMN GRID VIEW */
        <div className="profile-cards-grid">
          {/* Card 1 Edit: Profile photo & Actions */}
          <div className="account-profile-header-card" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingTop: '16px' }}>
              
              {/* Progress Ring wrapping the Profile Avatar in Edit Mode */}
              <div className="profile-avatar-wrapper" style={{ margin: '20px 0', width: '150px', height: '150px', position: 'relative' }}>
                <svg height="150" width="150" className="progress-ring" style={{ transform: 'rotate(-90deg)' }}>
                  <circle className="progress-ring-bg" stroke="var(--border-light, var(--border-light))" fill="transparent" strokeWidth={strokeWidth} r={radius} cx="75" cy="75" />
                  <circle className="progress-ring-circle" stroke={progressColor} fill="transparent" strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" r={radius} cx="75" cy="75" style={{ stroke: progressColor }} />
                </svg>

                {/* Profile Image container placed inside the progress ring */}
                <div 
                  onClick={triggerFileSelect}
                  onMouseEnter={() => setIsAvatarHovered(true)}
                  onMouseLeave={() => setIsAvatarHovered(false)}
                  style={{
                    position: 'absolute',
                    top: '13px',
                    left: '13px',
                    width: '124px',
                    height: '124px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  title="Upload image from desktop"
                >
                  <img src={avatarUrl} alt={formData.fullName} className="profile-avatar-img" />
                  
                  {/* Camera Hover overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    opacity: isAvatarHovered ? 1 : 0,
                    transition: 'opacity 0.05s ease',
                  }}>
                    <Camera size={26} />
                  </div>
                </div>
              </div>

              {/* Hidden Input file selection */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />

              <p style={{ fontSize: '12px', color: 'var(--text-secondary, var(--text-secondary))', lineHeight: '1.5', textAlign: 'center', margin: '0 0 16px 0' }}>
                Refining details for <strong>{formData.fullName}</strong>. Remember to click save.
              </p>
            </div>

            <div className="edit-form-actions" style={{ flexDirection: 'column', gap: '8px', width: '100%', marginTop: 'auto' }}>
              <button type="button" className="btn-cancel" onClick={handleCancel} style={{ width: '100%', justifyContent: 'center', padding: '8px' }}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-save"
                onClick={handleSave}
                disabled={isSaving || phoneError}
                style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Card 2 Edit: Personal Information */}
          <div className="account-profile-header-card" style={{ justifyContent: 'flex-start' }}>
            <h2 className="card-title-header">Edit Personal Info</h2>
            
            <div className="edit-form-grid" style={{ width: '100%', gridTemplateColumns: '1fr', gap: '10px', marginTop: '6px' }}>
              <div className="edit-form-group">
                <label className="edit-form-label">Name</label>
                <input 
                  type="text" 
                  name="fullName"
                  className="edit-form-input" 
                  value={tempFormData.fullName}
                  onChange={handleChange}
                  placeholder="Edwin Antony"
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="edit-form-input"
                  value={tempFormData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  aria-invalid={phoneError}
                  style={phoneError ? { borderColor: 'var(--danger)' } : undefined}
                />
                {phoneError && (
                  <span style={{ color: 'var(--danger)', fontSize: '11px' }}>
                    Enter a valid phone number
                  </span>
                )}
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Email</label>
                <div className="edit-form-input-container">
                  <input 
                    type="email" 
                    name="email"
                    className="edit-form-input" 
                    value={tempFormData.email}
                    onChange={handleChange}
                    disabled={lockedFields.email}
                    placeholder="edwin.antony@omnieye.com"
                  />
                  <button 
                    type="button" 
                    className="edit-lock-btn"
                    onClick={() => toggleLock('email')}
                    title={lockedFields.email ? "Unlock field" : "Lock field"}
                  >
                    {lockedFields.email ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                </div>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Organization</label>
                <div className="edit-form-input-container">
                  <input 
                    type="text" 
                    name="organization"
                    className="edit-form-input" 
                    value={tempFormData.organization}
                    onChange={handleChange}
                    disabled={lockedFields.organization}
                    placeholder="OomniEye Digital Twin Solutions"
                  />
                  <button 
                    type="button" 
                    className="edit-lock-btn"
                    onClick={() => toggleLock('organization')}
                    title={lockedFields.organization ? "Unlock field" : "Lock field"}
                  >
                    {lockedFields.organization ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                </div>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Department</label>
                <div className="edit-form-input-container">
                  <input 
                    type="text" 
                    name="department"
                    className="edit-form-input" 
                    value={tempFormData.department}
                    onChange={handleChange}
                    disabled={lockedFields.department}
                    placeholder="Product Design"
                  />
                  <button 
                    type="button" 
                    className="edit-lock-btn"
                    onClick={() => toggleLock('department')}
                    title={lockedFields.department ? "Unlock field" : "Lock field"}
                  >
                    {lockedFields.department ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                </div>
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Job Title</label>
                <div className="edit-form-input-container">
                  <input 
                    type="text" 
                    name="jobTitle"
                    className="edit-form-input" 
                    value={tempFormData.jobTitle}
                    onChange={handleChange}
                    disabled={lockedFields.jobTitle}
                    placeholder="UI/UX Designer"
                  />
                  <button 
                    type="button" 
                    className="edit-lock-btn"
                    onClick={() => toggleLock('jobTitle')}
                    title={lockedFields.jobTitle ? "Unlock field" : "Lock field"}
                  >
                    {lockedFields.jobTitle ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 Edit: Account Informations */}
          <div className="account-profile-header-card" style={{ justifyContent: 'flex-start' }}>
            <h2 className="card-title-header">Edit Account Info</h2>
            
            <div className="edit-form-grid" style={{ width: '100%', gridTemplateColumns: '1fr', gap: '12px', marginTop: '6px' }}>
              <div className="edit-form-group">
                <label className="edit-form-label">Region</label>
                <input 
                  type="text" 
                  name="location"
                  className="edit-form-input" 
                  value={tempFormData.location}
                  onChange={handleChange}
                  placeholder="India"
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Member Since</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  value={formData.memberSince}
                  disabled
                  title="Member since date cannot be updated"
                />
              </div>

              <div className="edit-form-group">
                <label className="edit-form-label">Last Updated</label>
                <input 
                  type="text" 
                  className="edit-form-input" 
                  value="Today, 10:30 AM"
                  disabled
                  title="Updated timestamp is managed automatically"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
