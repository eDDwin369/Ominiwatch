import { useThemeStore } from 'omnieye-theme-studio';
import logo from '../../assets/logo.png';
import './PreviewLogin.css';

export function PreviewLogin() {
  const brand = useThemeStore((s) => s.settings);

  return (
    <div className={`preview-login-container dashboard-fade-in ${brand.loginLayout === 'centered' ? 'layout-centered' : ''}`}>
      {brand.loginLayout !== 'centered' && (
        <div className="preview-login-left">
          <div className="preview-login-brand">
            <img 
              src={brand.logoUrl || logo} 
              alt="Logo" 
              style={{ 
                maxWidth: '140px', 
                maxHeight: '140px',
                width: 'auto',
                height: 'auto', 
                marginBottom: '1rem',
                objectFit: 'contain'
              }} 
            />
          </div>
        </div>
      )}
      
      <div className="preview-login-right">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: '1.75rem' }}>
            <img 
              src={brand.logoUrl || logo} 
              alt="Logo" 
              style={{ maxWidth: '240px', width: '100%', height: 'auto', display: 'block', margin: '0 auto', objectFit: 'contain' }} 
            />
          </div>
          <div className="preview-login-card">
            <h2 className="preview-login-card-title">Sign in</h2>
            <p className="preview-login-card-subtitle">Welcome back to {brand.appName || 'Nexus ERP'}</p>
          
          <div className="preview-login-form">
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="text" className="form-input" defaultValue="admin@company.com" disabled />
            </div>
            <div className="input-group active">
              <label className="input-label">Password</label>
              <input type="password" className="form-input" defaultValue="password" disabled />
            </div>
            <button className="preview-login-btn">SIGN IN</button>
          </div>
          
          <div className="preview-login-footer">
            Powered by <strong>{brand.appName || 'Nexus ERP'}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
