import { ThemeStudio } from 'omnieye-theme-studio';
import loginBg from '../../assets/login-bg.jpg';
import logo from '../../assets/logo.png';

/**
 * Mounts the real omnieye-theme-studio package (rail + its own preview screens)
 * inside the host. The MUI theme comes from the root StudioTheme provider
 * (theme-bridge.tsx). defaultLoginImage backs the Login preview's brand-image
 * panel until the user uploads their own, so it never shows blank; defaultLogo does the
 * same for the logo, matching the real login page.
 */
export function ThemeStudioEmbed() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ThemeStudio defaultLoginImage={loginBg} defaultLogo={logo} />
    </div>
  );
}
// Trigger HMR update for patched ThemeStudio

