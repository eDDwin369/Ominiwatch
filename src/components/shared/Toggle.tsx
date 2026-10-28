import React from 'react';
import './SharedUI.css';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id
}: ToggleProps) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`figma-toggle-container ${disabled ? 'disabled' : ''}`}>
      {(label || description) && (
        <div className="figma-toggle-text-group">
          {label && (
            <label htmlFor={toggleId} className="figma-toggle-label">
              {label}
            </label>
          )}
          {description && (
            <span className="figma-toggle-desc">{description}</span>
          )}
        </div>
      )}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`figma-switch ${checked ? 'checked' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="figma-switch-thumb" />
      </button>
    </div>
  );
}
