import { ThemeStudio } from 'omnieye-theme-studio';
import loginBg from '../../assets/login-bg.jpg';

/**
 * Mounts the real omnieye-theme-studio package (rail + its own preview screens)
 * inside the host. The MUI theme comes from the root StudioTheme provider
 * (theme-bridge.tsx). defaultLoginImage backs the Login preview's brand-image
 * panel until the user uploads their own, so it never shows blank.
 */
export function ThemeStudioEmbed() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ThemeStudio defaultLoginImage={loginBg} />
    </div>
  );
}
// Trigger HMR update for patched ThemeStudio

