import { ThemeStudio } from 'omnieye-theme-studio';

/**
 * Mounts the real omnieye-theme-studio package (rail + its own preview screens)
 * inside the host. The MUI theme comes from the root StudioTheme provider
 * (theme-bridge.tsx).
 */
export function ThemeStudioEmbed() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ThemeStudio />
    </div>
  );
}
