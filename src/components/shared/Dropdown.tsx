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
}

// Custom div-based dropdown replacing native <select> chrome. 'pill' variant is the small
// rounded H1/weight control from Global Settings (Figma: closed = gradient pill, open = list
// with the selected row still shown as the pill, siblings plain). 'rect' variant keeps the
// existing chevron-box look used by form/preference selects.
export function Dropdown({ value, onChange, options, variant = 'rect', width, title, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={rootRef} className={`gs-dd-root ${className || ''}`} style={{ width }}>
      <button
        type="button"
        title={title}
        className={`gs-dd-trigger gs-dd-trigger-${variant}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="gs-dd-trigger-label">{selected?.label ?? value}</span>
        {variant === 'rect' && <ChevronDown size={14} className="gs-dd-chevron" />}
      </button>

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
