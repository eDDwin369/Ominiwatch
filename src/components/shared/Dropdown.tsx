import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
//
// The open menu is portaled to document.body: several hosts (e.g. Global Settings' modal)
// wrap this in `overflow: hidden` ancestors for a fixed-size, no-scroll layout, which clips
// an absolutely-positioned menu no matter how high its z-index is. Portaling + `position:
// fixed` sized from the trigger's own bounding rect sidesteps that clipping entirely.
export function Dropdown({ value, onChange, options, variant = 'rect', width, title, className, editable }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [menuRect, setMenuRect] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const opts: DropdownOption[] = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = opts.find((o) => o.value === value);

  const measure = () => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 220 && rect.top > spaceBelow;
    // Menu is at least 65px wide even when the trigger itself is narrower (the
    // weight pill is ~46-64px, too cramped for a comfortable option list).
    const menuWidth = Math.max(rect.width, 65);
    setMenuRect({
      left: rect.left,
      width: menuWidth,
      ...(openUpward ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
  };

  useEffect(() => {
    if (!open) return;
    measure();
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onReposition = () => measure();
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {open && menuRect && createPortal(
        <div
          ref={menuRef}
          className="gs-dd-menu"
          role="listbox"
          style={{ position: 'fixed', left: menuRect.left, width: menuRect.width, top: menuRect.top, bottom: menuRect.bottom }}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}
