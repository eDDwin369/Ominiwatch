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
  editable?: boolean;
}

export function Dropdown({
  value,
  onChange,
  options,
  variant = 'rect',
  width,
  title,
  className,
  editable,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [menuRect, setMenuRect] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    openUpward?: boolean;
  } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const opts: DropdownOption[] = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  const selected = opts.find((o) => o.value === value);

  const measure = () => {
    // Measure the visible trigger element directly for exact pixel geometry
    const triggerEl = triggerRef.current || rootRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 170 && rect.top > spaceBelow;

    let menuWidth = rect.width;
    let menuLeft = rect.left;

    if (variant === 'pill') {
      // Sleek capsule width with reduced side gap, centered directly under trigger
      menuWidth = Math.min(Math.max(rect.width - 14, 46), 50);
      menuLeft = rect.left + (rect.width - menuWidth) / 2;
    } else {
      menuWidth = Math.max(rect.width, 130);
    }

    setMenuRect({
      left: Math.round(menuLeft),
      width: Math.round(menuWidth),
      openUpward,
      ...(openUpward
        ? { bottom: Math.round(window.innerHeight - rect.top + 4) }
        : { top: Math.round(rect.bottom + 4) }),
    });
  };

  useEffect(() => {
    if (!open) return;
    measure();

    // Smoothly scroll active item into view on open
    requestAnimationFrame(() => {
      const selectedEl = menuRef.current?.querySelector('.gs-dd-option-selected');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    });

    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = opts.findIndex((o) => o.value === value);
        if (currentIndex < opts.length - 1) {
          onChange(opts[currentIndex + 1].value);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = opts.findIndex((o) => o.value === value);
        if (currentIndex > 0) {
          onChange(opts[currentIndex - 1].value);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(false);
      }
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
  }, [open, value, opts]);

  const commitDraft = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    setEditing(false);
  };

  return (
    <div
      ref={rootRef}
      className={`gs-dd-root gs-dd-root-${variant} ${className || ''}`}
      style={{ width }}
    >
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
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          title={
            editable
              ? `${title || ''}${title ? ' — ' : ''}double-click to type a custom value`.trim()
              : title
          }
          className={`gs-dd-trigger gs-dd-trigger-${variant} ${open ? 'gs-dd-trigger-open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          onDoubleClick={
            editable
              ? (e) => {
                  e.stopPropagation();
                  setOpen(false);
                  setDraft(value);
                  setEditing(true);
                  requestAnimationFrame(() => inputRef.current?.select());
                }
              : undefined
          }
        >
          <span className="gs-dd-trigger-label">{selected?.label ?? value}</span>
          {variant === 'rect' && (
            <ChevronDown size={13} className={`gs-dd-chevron ${open ? 'open' : ''}`} />
          )}
        </button>
      )}

      {open && menuRect &&
        createPortal(
          <div
            ref={menuRef}
            className={`gs-dd-menu gs-dd-menu-${variant} ${
              menuRect.openUpward ? 'gs-dd-menu-up' : 'gs-dd-menu-down'
            }`}
            role="listbox"
            style={{
              position: 'fixed',
              left: menuRect.left,
              width: menuRect.width,
              top: menuRect.top,
              bottom: menuRect.bottom,
            }}
          >
            {opts.map((o) => {
              const isSelected = o.value === value;
              return (
                <button
                  type="button"
                  key={o.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`gs-dd-option ${isSelected ? 'gs-dd-option-selected' : ''}`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="gs-dd-option-label">{o.label}</span>
                  {variant === 'rect' && isSelected && (
                    <span className="gs-dd-option-check">✓</span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
