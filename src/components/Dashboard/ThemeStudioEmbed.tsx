import { X } from 'lucide-react';
import { ThemeStudio } from 'omnieye-theme-studio';

interface ThemeStudioEmbedProps {
  onClose: () => void;
}

/**
 * Mounts the real omnieye-theme-studio package (rail + its own preview screens)
 * inside the host. The MUI theme comes from the root StudioTheme provider
 * (theme-bridge.tsx). ThemeStudio's own internal close only collapses its rail,
 * so we add an Exit affordance wired to the host's onClose.
 */
export function ThemeStudioEmbed({ onClose }: ThemeStudioEmbedProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <button
        onClick={onClose}
        aria-label="Exit Theme Studio"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-light, var(--border-light))',
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <X size={14} />
        Exit
      </button>
      <ThemeStudio />
    </div>
  );
}
