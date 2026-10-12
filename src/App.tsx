import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, CheckCircle2, XCircle, Check, Info, Headset } from 'lucide-react';
import { TextField } from './components/shared/TextField';
import './index.css';
import logo from './assets/logo.png';
import loginBg from './assets/login-bg.jpg';
import { Dashboard } from './components/Dashboard/Dashboard';
import { HelpFeatureMount } from './help-app/HelpFeatureMount';
import { useThemeStore } from 'omnieye-theme-studio';
import { 
  type Screen, 
  type AppRouteState, 
  isAuthenticated, 
  setSession, 
  getSessionEmail, 
  parseRouteFromUrl, 
  pushAppRoute, 
  replaceAppRoute,
  roleFromEmail,
  INTRO_PENDING_KEY
} from './utils/navigation';

function App() {
  // Studio login tokens: tagline text + whether to show it, on the login panel.
  const brand = useThemeStore((s) => s.settings);
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const route = parseRouteFromUrl();
    if (isAuthenticated()) {
      return route.screen === 'dashboard' ? 'dashboard' : route.screen;
    }
    return route.screen === 'dashboard' ? 'login' : route.screen;
  });

  const navigateScreen = (screen: Screen) => {
    setCurrentScreen(screen);
    pushAppRoute({ screen });
  };

  // Synchronize history popstate and initial route
  useEffect(() => {
    const initialRoute = parseRouteFromUrl();
    if (isAuthenticated()) {
      if (initialRoute.screen === 'dashboard' || !window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
        const target: AppRouteState = {
          screen: 'dashboard',
          view: initialRoute.view || 'overview',
          tab: initialRoute.tab,
          editMode: initialRoute.editMode,
          themeStudioOpen: initialRoute.themeStudioOpen
        };
        replaceAppRoute(target);
        setCurrentScreen('dashboard');
      } else {
        replaceAppRoute(initialRoute);
        setCurrentScreen(initialRoute.screen);
      }
    } else {
      if (initialRoute.screen === 'dashboard') {
        replaceAppRoute({ screen: 'login' });
        setCurrentScreen('login');
      } else {
        replaceAppRoute(initialRoute);
        setCurrentScreen(initialRoute.screen);
      }
    }

    const handlePopState = () => {
      const popped = parseRouteFromUrl();
      if (popped.screen === 'dashboard') {
        if (isAuthenticated()) {
          setCurrentScreen('dashboard');
        } else {
          replaceAppRoute({ screen: 'login' });
          setCurrentScreen('login');
        }
      } else {
        setCurrentScreen(popped.screen);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Shared state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } catch {
      // ignore
    }
    return false;
  });

  const [sidebarVisible, setSidebarVisible] = useState(true);

  const [sidebarAutoHide, setSidebarAutoHide] = useState(() => {
    try {
      const saved = localStorage.getItem('gs_autoHideSidebar');
      return saved !== null ? JSON.parse(saved) : false; // Default: false (Pinned / Visible by default)
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

  // Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
      setSession(true, email, roleFromEmail(email));
      // the welcome intro plays once, right after login
      try { sessionStorage.setItem(INTRO_PENDING_KEY, '1'); } catch { /* storage unavailable: skip the intro */ }
      const targetRoute: AppRouteState = { screen: 'dashboard', view: 'overview' };
      replaceAppRoute(targetRoute);
      setCurrentScreen('dashboard');
    }, 1000);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setTimeLeft(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      navigateScreen('otp');
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
        navigateScreen('new-password');
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
      navigateScreen('success');
    }, 1500);
  };

  const handleLogout = () => {
    setSession(false);
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    if (!savedRememberMe) {
      setEmail('');
      setPassword('');
    }
    replaceAppRoute({ screen: 'login' });
    setCurrentScreen('login');
  };

  if (currentScreen === 'dashboard') {
    return (
      <>
        <div id="help-portal-root" className="help-scope" />
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
        />
        <HelpFeatureMount />
      </>
    );
  }

  return (
    <>
      <div className="ambient-glow"></div>

      <div className={`login-container ${brand.loginLayout === 'centered' ? 'layout-centered' : ''}`}>
        {/* Left Side - Visual Branding only image will be there no taglines.
            backgroundImage set directly from store here (not the --login-image CSS
            var) so it always reflects the latest Theme Studio upload, falling back
            to the bundled default when nothing's uploaded. */}
        <div className="visual-panel" style={{ backgroundImage: `url(${brand.loginImage || loginBg})` }}></div>

        {/* Right Side - Dynamic Forms.
            background read straight from the store too (same reasoning as
            visual-panel above) instead of the --login-panel-color CSS var, which
            theme-bridge.tsx always overwrites with a flat color (even when unset),
            permanently hiding this panel's intended default gradient. */}
        <div className="form-panel" style={{ background: brand.loginPanelColor || 'var(--brand-page-wash)' }}>
          <div className="auth-logo">
            {brand.logoMode === 'image' && brand.logoUrl ? (
              // Uploaded logo is cropped to a 3.5:1 box in Theme Studio (LoginPanel) —
              // match that aspect here instead of forcing it into a 220x220 square.
              <img src={brand.logoUrl} alt="Logo" style={{ maxWidth: '220px', maxHeight: '63px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
            ) : (
              <img src={logo} alt="Logo" className="auth-logo-default" />
            )}
          </div>
          <div className="outer-auth-card">

            {currentScreen === 'login' && (
              <div className="fade-in">
                {isAuthenticated() && (
                  <div style={{
                    background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                    border: '1px solid var(--primary)',
                    borderRadius: 'calc(var(--radius-unit, 1px) * 12)',
                    padding: '10px 14px',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: 'var(--font-size-caption, 12px)', color: 'var(--text-main)' }}>
                      Active session as <strong>{getSessionEmail() || 'Edwin Antony'}</strong>
                    </span>
                    <button
                      type="button"
                      className="shell-btn-primary shell-btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => {
                        replaceAppRoute({ screen: 'dashboard', view: 'overview' });
                        setCurrentScreen('dashboard');
                      }}
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}
                <form onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <TextField
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <div className="auth-options" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <label className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span style={{ marginLeft: '6px' }}>Remember me</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a
                        href="#/forgot-password"
                        onClick={(e) => { e.preventDefault(); navigateScreen('forgot-password'); }}
                        className="auth-nav-link"
                      >
                        Forgot password?
                      </a>
                      <div
                        title="Please contact admin@oomnieye.com"
                        className="auth-help-icon"
                      >
                        <Headset size={14} />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="submit-btn shell-btn-primary" disabled={!email.trim() || !password} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Sign in <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            )}

            {currentScreen === 'forgot-password' && (
              <div className="fade-in">
                <form onSubmit={handleForgotPasswordSubmit}>
                  <div className="form-group">
                    <TextField
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <button type="submit" className={`submit-btn shell-btn-primary ${isLoading ? 'loading' : ''}`} disabled={isLoading || !email} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isLoading ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} />
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <a
                      href="#/login"
                      onClick={(e) => { e.preventDefault(); navigateScreen('login'); }}
                      className="auth-nav-link"
                    >
                      Back to login
                    </a>
                  </div>
                </form>
              </div>
            )}

            {currentScreen === 'otp' && (
              <div className="fade-in">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: 'var(--font-size-h4)', color: 'var(--text-secondary)' }}>
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
                    <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--text-secondary)' }}>Resend code in {timeLeft}s</span>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleResendOtp(); }}
                      className="auth-nav-link"
                    >
                      Resend OTP
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className={`submit-btn shell-btn-primary ${isLoading ? 'loading' : ''}`}
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.join('').length !== 6 || timeLeft === 0}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'} <ArrowRight size={18} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <a
                    href="#/forgot-password"
                    className="auth-nav-link"
                    onClick={(e) => { e.preventDefault(); navigateScreen('forgot-password'); }}
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
                    <TextField
                      label="New password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    {newPassword.length === 0 ? (
                      <div className="validation-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '0.75rem', fontSize: 'var(--font-size-caption)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, var(--text-muted))' }}>
                          <span style={{ fontWeight: 'var(--font-weight-strong, 600)' }}>•</span> At least 12 characters
                        </div>
                      </div>
                    ) : (
                      (!passwordReqs.length || !passwordReqs.notCommon || !passwordReqs.noPersonal) && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '0.75rem', padding: '10px 12px', backgroundColor: 'color-mix(in srgb, var(--danger) 6%, transparent)', borderRadius: 'calc(var(--radius-unit, 1px) * 8)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}>
                          <Info size={14} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: 'var(--font-size-caption)', fontWeight: 'var(--font-weight-strong, 600)', color: 'var(--danger)' }}>Security requirements not met:</span>
                            <div className="validation-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'var(--font-size-caption)' }}>
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
                    <TextField
                      label="Confirm new password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    {confirmPassword && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: 'var(--font-size-caption)',
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
                    className={`submit-btn shell-btn-primary ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading || !isPasswordValid}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {isLoading ? 'Updating...' : 'Reset Password'} <Check size={18} />
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <a
                      href="#/login"
                      className="auth-nav-link"
                      onClick={(e) => { e.preventDefault(); navigateScreen('login'); }}
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
                <div style={{ fontSize: 'var(--font-size-body)', fontWeight: 'var(--font-weight-strong, 600)', color: 'var(--text-main)', marginBottom: '2rem' }}>
                  Password Updated Successfully
                </div>
                <button
                  type="button"
                  className="submit-btn shell-btn-primary"
                  onClick={() => {
                    navigateScreen('login');
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
