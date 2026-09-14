import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './Dropdown.css';

export interface DropdownOption {
  value: string;
  label: React.ReactNode;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[] | string[];
  variant?: 'pill' | 'rect';
  width?: number | string;
  title?: string;
  className?: string;
  // Lets the user type a custom value instead of picking one of `options` —
  // used for the H1-H6 weight pills, where 100-900 covers the common cases
  // but a designer may still want an odd value like 350.
  editable?: boolean;
}

// Custom div-based dropdown replacing native <select> chrome. 'pill' variant is the small
// rounded H1/weight control from Global Settings (Figma: closed = gradient pill, open = list
// with the selected row still shown as the pill, siblings plain). 'rect' variant keeps the
// existing chevron-box look used by form/preference selects.
export function Dropdown({ value, onChange, options, variant = 'rect', width, title, className, editable }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const opts: DropdownOption[] = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = opts.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    setEditing(false);
  };

  return (
    <div ref={rootRef} className={`gs-dd-root ${className || ''}`} style={{ width }}>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          className={`gs-dd-trigger gs-dd-trigger-${variant} gs-dd-trigger-input`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitDraft();
            if (e.key === 'Escape') { setDraft(value); setEditing(false); }
          }}
        />
      ) : (
        <button
          type="button"
          title={editable ? `${title || ''}${title ? ' — ' : ''}double-click to type a custom value`.trim() : title}
          className={`gs-dd-trigger gs-dd-trigger-${variant}`}
          onClick={() => setOpen((o) => !o)}
          onDoubleClick={editable ? (e) => {
            e.stopPropagation();
            setOpen(false);
            setDraft(value);
            setEditing(true);
            requestAnimationFrame(() => inputRef.current?.select());
          } : undefined}
        >
          <span className="gs-dd-trigger-label">{selected?.label ?? value}</span>
          {variant === 'rect' && <ChevronDown size={14} className="gs-dd-chevron" />}
        </button>
      )}

      {open && (
        <div className="gs-dd-menu" role="listbox">
          {opts.map((o) => (
            <button
              type="button"
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`gs-dd-option ${o.value === value ? 'gs-dd-option-selected' : ''}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
