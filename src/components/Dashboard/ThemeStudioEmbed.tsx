import { ThemeStudio } from 'omnieye-theme-studio';

/**
 * Mounts the real omnieye-theme-studio package (rail + its own preview screens)
 * inside the host. The MUI theme comes from the root StudioTheme provider
 * (theme-bridge.tsx).
 */
export function ThemeStudioEmbed() {
  return (
<<<<<<< HEAD
    <div className="theme-studio-embed" style={{ position: 'relative', width: '100%', height: '100%' }}>
=======
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
>>>>>>> a5bb05902d1612e8ef4b3a8b6ffaff413a28dd7a
      <ThemeStudio />
    </div>
  );
}
<<<<<<< HEAD
// Trigger HMR update for patched ThemeStudio

=======
>>>>>>> a5bb05902d1612e8ef4b3a8b6ffaff413a28dd7a
