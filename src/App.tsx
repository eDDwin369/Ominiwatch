import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2, XCircle, KeyRound, Check, Info, Headset } from 'lucide-react';
import './index.css';
import logo from './assets/logo.png';
import gmailBg from './assets/gmail-bg.jpg';
import { Dashboard } from './components/Dashboard/Dashboard';
import { useThemeStore } from 'omnieye-theme-studio';

type Screen = 'login' | 'forgot-password' | 'otp' | 'new-password' | 'success' | 'dashboard' | 'forgot-username';

function App() {
  // Studio login tokens: tagline text + whether to show it, on the login panel.
  const brand = useThemeStore((s) => s.settings);
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [showLanding, setShowLanding] = useState(true);

  // Shared state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // sidebarLocked is now strictly derived from sidebarAutoHide to prevent layout state mismatch.
  // We keep the variables to pass them down into the Dashboard.

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const savedCollapsed = localStorage.getItem('sidebarCollapsed');
      if (savedCollapsed !== null && savedCollapsed !== 'undefined') {
        return JSON.parse(savedCollapsed);
      }
      const startExpanded = localStorage.getItem('gs_startExpanded');
      if (startExpanded !== null && startExpanded !== 'undefined') {
        return !JSON.parse(startExpanded);
      }
    } catch (e) {
      // ignore
    }
    return true;
  });

  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [sidebarAutoHide, setSidebarAutoHide] = useState(() => {
    try {
      const saved = localStorage.getItem('gs_autoHideSidebar');
      return saved !== null ? JSON.parse(saved) : false; // Default: false
    } catch {
      return false;
    }
  });

  const sidebarLocked = !sidebarAutoHide;

  const handleSetSidebarAutoHide = (val: boolean) => {
    setSidebarAutoHide(val);
    localStorage.setItem('gs_autoHideSidebar', JSON.stringify(val));
  };

  const [sidebarExpandedWidth, setSidebarExpandedWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('gs_expandedWidth');
      return saved !== null ? Number(saved) : 260;
    } catch {
      return 260;
    }
  });

  const [sidebarCollapsedWidth, setSidebarCollapsedWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('gs_collapsedWidth');
      return saved !== null ? Number(saved) : 68;
    } catch {
      return 68;
    }
  });

  const [sidebarShowIcons, setSidebarShowIcons] = useState(() => {
    try {
      const saved = localStorage.getItem('gs_showIcons');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [sidebarShowLabels, setSidebarShowLabels] = useState(() => {
    try {
      const saved = localStorage.getItem('gs_showLabels');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleSetSidebarExpandedWidth = (val: number) => {
    setSidebarExpandedWidth(val);
    localStorage.setItem('gs_expandedWidth', JSON.stringify(val));
  };

  const handleSetSidebarCollapsedWidth = (val: number) => {
    setSidebarCollapsedWidth(val);
    localStorage.setItem('gs_collapsedWidth', JSON.stringify(val));
  };

  const handleSetSidebarShowIcons = (val: boolean) => {
    setSidebarShowIcons(val);
    localStorage.setItem('gs_showIcons', JSON.stringify(val));
  };

  const handleSetSidebarShowLabels = (val: boolean) => {
    setSidebarShowLabels(val);
    localStorage.setItem('gs_showLabels', JSON.stringify(val));
  };

  const handleSetSidebarCollapsed = (val: boolean) => {
    setSidebarCollapsed(val);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(val));
  };

  const handleSetSidebarLocked = (locked: boolean) => {
    const newAutoHide = !locked;
    setSidebarAutoHide(newAutoHide);
    localStorage.setItem('gs_autoHideSidebar', JSON.stringify(newAutoHide));
  };

  // Load saved credentials on mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    setRememberMe(savedRememberMe);
    if (savedRememberMe) {
      const savedEmail = localStorage.getItem('email') || '';
      const savedPassword = localStorage.getItem('password') || '';
      setEmail(savedEmail);
      setPassword(savedPassword);
    }
  }, []);

  // Autofill email on forgot password screen if empty but exists in localStorage
  useEffect(() => {
    if (currentScreen === 'forgot-password' && !email) {
      const savedEmail = localStorage.getItem('email') || '';
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, [currentScreen]);

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [otpError, setOtpError] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);

  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt', { email, password });
    
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('email', email);
      localStorage.setItem('password', password);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('email');
      localStorage.removeItem('password');
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentScreen('dashboard');
    }, 1000);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setCurrentScreen('otp');
      setTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
    }, 1200);
  };

  // OTP Timer
  useEffect(() => {
    if (currentScreen === 'otp' && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [currentScreen, timeLeft]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    // Take only the last character if multiple are entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setOtpError('');

    // Auto-advance
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Auto-retreat
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];

    for (let i = 0; i < digits.length; i++) {
      newOtp[i] = digits[i];
    }
    setOtp(newOtp);

    // Focus next empty or last input
    const focusIndex = Math.min(digits.length, 5);
    otpRefs.current[focusIndex === 6 ? 5 : focusIndex]?.focus();
  };

  const handleVerifyOtp = () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setOtpError('Please enter a 6-digit code.');
      return;
    }

    if (otpAttempts >= 3) {
      setOtpError('Too many failed attempts. Please request a new code.');
      return;
    }

    if (timeLeft === 0) {
      setOtpError('Verification code expired.');
      return;
    }

    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      if (code === '123456') { // Mock correct OTP
        setCurrentScreen('new-password');
      } else {
        setOtpAttempts(prev => prev + 1);
        setOtpError('Invalid verification code.');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    }, 1500);
  };

  const handleResendOtp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setOtpAttempts(0);
    }, 1000);
  };

  // Password Validation
  const passwordReqs = {
    length: newPassword.length >= 12,
    notCommon: !['123456', 'password', '12345678', '123456789', 'qwerty', 'admin', 'welcome'].includes(newPassword.toLowerCase()),
    noPersonal: email ? (
      !newPassword.toLowerCase().includes(email.toLowerCase()) && 
      !newPassword.toLowerCase().includes(email.split('@')[0].toLowerCase())
    ) : true,
  };
  const isPasswordValid = Object.values(passwordReqs).every(Boolean) && newPassword === confirmPassword;


  const handleCreateNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentScreen('success');
    }, 1500);
  };



  if (showLanding) {
    return (
      <div 
        className="landing-screen-container" 
        style={{ 
          background: '#f4f6f8',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onClick={() => setShowLanding(false)}
      >
        <img 
          src={gmailBg} 
          alt="Welcome Email" 
          style={{ 
            maxWidth: '100vw', 
            maxHeight: '100vh', 
            objectFit: 'contain',
            transform: 'scale(1.25) translateZ(0)',
            backfaceVisibility: 'hidden',
            imageRendering: '-webkit-optimize-contrast',
            transition: 'transform 0.05s ease',
          }} 
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.28) translateZ(0)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1.25) translateZ(0)';
          }}
        />
      </div>
    );
  }

  const handleLogout = () => {
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    if (!savedRememberMe) {
      setEmail('');
      setPassword('');
    }
    setCurrentScreen('login');
  };

  if (currentScreen === 'dashboard') {
    return (
      <Dashboard 
        onLogout={handleLogout} 
        sidebarLocked={sidebarLocked}
        setSidebarLocked={handleSetSidebarLocked}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={handleSetSidebarCollapsed}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        sidebarAutoHide={sidebarAutoHide}
        setSidebarAutoHide={handleSetSidebarAutoHide}
        sidebarExpandedWidth={sidebarExpandedWidth}
        setSidebarExpandedWidth={handleSetSidebarExpandedWidth}
        sidebarCollapsedWidth={sidebarCollapsedWidth}
        setSidebarCollapsedWidth={handleSetSidebarCollapsedWidth}
        sidebarShowIcons={sidebarShowIcons}
        setSidebarShowIcons={handleSetSidebarShowIcons}
        sidebarShowLabels={sidebarShowLabels}
        setSidebarShowLabels={handleSetSidebarShowLabels}
      />
    );
  }

  return (
    <>
      <div className="ambient-glow"></div>

      <div className={`login-container ${brand.loginLayout === 'centered' ? 'layout-centered' : ''}`}>
        {/* Left Side - Visual Branding */}
        <div className="visual-panel">
          {brand.loginShowTagline && brand.appTagline && (
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                margin: 'auto',
                padding: '3.5rem',
                color: '#ffffff',
                fontSize: '2rem',
                fontWeight: 600,
                lineHeight: 1.2,
                textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                fontFamily: 'var(--app-heading-family)',
              }}
            >
              {brand.appTagline}
            </div>
          )}
        </div>

        {/* Right Side - Dynamic Forms */}
        <div className="form-panel">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img 
              src={brand.logoMode === 'image' && brand.logoUrl ? brand.logoUrl : logo} 
              alt="Logo" 
              style={{ maxWidth: '312px', height: 'auto', objectFit: 'contain' }} 
            />
          </div>
          <div className="outer-auth-card">

            {currentScreen === 'login' && (
              <div className="fade-in">
                <form onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={18} />
                      <input
                        type="email"
                        id="login-email"
                        className="form-input"
                        placeholder="User email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-password"
                        className="form-input"
                        placeholder=""
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', width: '100%' }}>
                    <label 
                      className="checkbox-wrapper"
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 400,
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{
                          width: '13px',
                          height: '13px',
                          accentColor: 'var(--text-secondary)',
                          opacity: 0.6,
                          cursor: 'pointer',
                          margin: 0
                        }}
                      />
                      <span style={{ marginLeft: '6px' }}>Remember me</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentScreen('forgot-password'); }}
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          transition: 'color 0.05s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        Forgot password?
                      </a>
                      <div 
                        title="Please contact admin@oomnieye.com" 
                        style={{ display: 'flex', alignItems: 'center', cursor: 'help', color: 'var(--text-secondary)' }}
                      >
                        <Headset size={14} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="submit-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Sign in <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            )}

            {currentScreen === 'forgot-password' && (
              <div className="fade-in">
                <form onSubmit={handleForgotPasswordSubmit}>
                  <div className="form-group">
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={18} />
                      <input
                        type="email"
                        id="forgot-email"
                        className="form-input"
                        placeholder="User email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading || !email} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isLoading ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} />
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setCurrentScreen('login'); }}
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.05s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      Back to login
                    </a>
                  </div>
                </form>
              </div>
            )}

            {currentScreen === 'otp' && (
              <div className="fade-in">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  If the email is registered, we've sent a verification code.
                </div>
                <div className="otp-container" style={{ margin: '1rem 0' }}>
                  <div className="otp-inputs" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        className={`otp-input ${otpError ? 'error' : ''}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        maxLength={1}
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  {otpError && (
                    <div className="error-message" style={{ marginTop: '0.75rem', justifyContent: 'center' }}>
                      <XCircle size={14} /> {otpError}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem', width: '100%' }}>
                  {timeLeft > 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Resend code in {timeLeft}s</span>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleResendOtp(); }}
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontWeight: 500
                      }}
                    >
                      Resend OTP
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className={`submit-btn ${isLoading ? 'loading' : ''}`}
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.join('').length !== 6 || timeLeft === 0}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'} <ArrowRight size={18} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setCurrentScreen('forgot-password'); }}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.05s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    Back
                  </a>
                </div>
              </div>
            )}

            {currentScreen === 'new-password' && (
              <div className="fade-in">
                <form onSubmit={handleCreateNewPassword}>
                  <div className="form-group">
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={18} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="new-password"
                        className="form-input"
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {newPassword.length === 0 ? (
                      <div className="validation-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '0.75rem', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, var(--text-muted))' }}>
                          <span style={{ fontWeight: 600 }}>•</span> At least 12 characters
                        </div>
                      </div>
                    ) : (
                      (!passwordReqs.length || !passwordReqs.notCommon || !passwordReqs.noPersonal) && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '0.75rem', padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                          <Info size={14} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--danger)' }}>Security requirements not met:</span>
                            <div className="validation-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem' }}>
                              {!passwordReqs.length && (
                                <div style={{ color: 'var(--text-secondary, var(--text-muted))' }}>
                                  • At least 12 characters
                                </div>
                              )}
                              {!passwordReqs.notCommon && (
                                <div style={{ color: 'var(--text-secondary, var(--text-muted))' }}>
                                  • Not a commonly used password
                                </div>
                              )}
                              {!passwordReqs.noPersonal && (
                                <div style={{ color: 'var(--text-secondary, var(--text-muted))' }}>
                                  • Doesn't contain your email or personal information
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="form-group">
                    <div className="input-wrapper">
                      <KeyRound className="input-icon" size={18} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="confirm-password"
                        className="form-input"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    {confirmPassword && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '0.78rem',
                        color: newPassword === confirmPassword ? 'var(--success, var(--success))' : 'var(--error, var(--danger))',
                        transition: 'color 0.05s'
                      }}>
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle2 size={14} /> Passwords match
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Passwords don't match
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={`submit-btn ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading || !isPasswordValid}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isLoading ? 'Updating...' : 'Reset Password'} <Check size={18} />
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setCurrentScreen('login'); }}
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.05s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      Back to login
                    </a>
                  </div>
                </form>
              </div>
            )}

            {currentScreen === 'success' && (
              <div className="fade-in success-screen" style={{ textAlign: 'center' }}>
                <div className="success-icon-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <CheckCircle2 className="success-icon" size={64} color="var(--success)" />
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2rem' }}>
                  Password Updated Successfully
                </div>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => {
                    setCurrentScreen('login');
                    setPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  style={{ width: '100%' }}
                >
                  Back to Login
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default App;
