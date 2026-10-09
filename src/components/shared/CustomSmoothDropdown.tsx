import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import './CustomSmoothDropdown.css';

interface CustomSmoothDropdownProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  className?: string;
}

interface MenuPos {
  top: number;
  left: number;
  width: number;
}

/**
 * Same boxed fieldset/legend trigger as the shared TextField (`tf-wrapper`/
 * `tf-outline`/`tf-legend`/`tf-select`/`tf-chevron`), opening the animated
 * check-icon panel used for AccountSettings' Language/Timezone pickers —
 * the trigger matches every other field's look, only the dropdown panel is
 * the newer custom one. The panel is portaled to <body> and fixed-positioned
 * off the trigger's rect so it floats above any scrollable/clipping ancestor
 * (e.g. a modal body) instead of growing that ancestor's scroll area.
 */
export function CustomSmoothDropdown({ label, value, options, onChange, className = '' }: CustomSmoothDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useLayoutEffect(() => {
    if (!isOpen || !dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnScrollOrResize = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', closeOnScrollOrResize, true);
      window.addEventListener('resize', closeOnScrollOrResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeOnScrollOrResize, true);
      window.removeEventListener('resize', closeOnScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className={`tf-field ${className}`}>
      <div className={`tf-wrapper ${isOpen ? 'tf-focused' : ''}`} ref={dropdownRef}>
        <fieldset className="tf-outline" aria-hidden="true">
          <legend className="tf-legend">{label}</legend>
        </fieldset>
        <button type="button" className="tf-select" onClick={() => setIsOpen((o) => !o)}>
          {selectedOption?.label || value}
        </button>
        <ChevronDown size={14} className={`tf-chevron figma-smooth-arrow ${isOpen ? 'open' : ''}`} />

        {isOpen &&
          menuPos &&
          createPortal(
            <div
              ref={menuRef}
              className="figma-smooth-dropdown-menu"
              style={{
                position: 'fixed',
                top: menuPos.top,
                left: menuPos.left,
                minWidth: menuPos.width,
                zIndex: 10050,
              }}
            >
              {options.map((opt) => (
                <div
                  key={opt.value}
                  className={`figma-smooth-option ${opt.value === value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Check size={14} className="figma-option-check" />}
                </div>
              ))}
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}
