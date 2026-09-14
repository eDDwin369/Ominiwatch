import { useThemeStore } from 'omnieye-theme-studio';
import logo from '../../assets/logo.png';
import './PreviewLogin.css';

export function PreviewLogin() {
  const brand = useThemeStore((s) => s.settings);

  const initials = brand.appName
    ? brand.appName.split(' ').map((w: string) => w[0] || '').join('').substring(0, 2).toUpperCase()
    : 'NE';

  return (
    <div className="preview-login-container dashboard-fade-in">
      <div className="preview-login-left">
        <div className="preview-login-brand">
          {brand.logoMode === 'image' ? (
            <img 
              src={brand.logoUrl || logo} 
              alt="Logo" 
              style={{ 
                maxWidth: '120px', 
                height: 'auto', 
                marginBottom: '1rem',
                objectFit: 'contain'
              }} 
            />
          ) : (
            <div 
              className="preview-login-logo"
              style={{ backgroundColor: brand.iconColor || 'var(--primary)' }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
      
      <div className="preview-login-right">
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
  );
}
