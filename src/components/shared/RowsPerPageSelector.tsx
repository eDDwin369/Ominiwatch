import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import './SharedUI.css';

export interface RowsPerPageSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  className?: string;
  label?: string;
}

interface MenuPos {
  top: number;
  left: number;
  width: number;
}

/**
 * Standard Rows Per Page Selector
 * Matches Reference Image: `Rows per page: [ 15 ∨ ]`
 */
export function RowsPerPageSelector({
  value,
  onChange,
  options = [10, 15, 25, 50],
  className = '',
  label = 'Rows per page:'
}: RowsPerPageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 68)
    });
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleScrollOrResize = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  return (
    <div className={`rows-per-page-container ${className}`}>
      {label && <span className="rows-per-page-label">{label}</span>}
      <button
        ref={triggerRef}
        type="button"
        className={`rows-per-page-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`rows-per-page-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            className="rows-per-page-menu"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              minWidth: `${menuPos.width}px`
            }}
            role="listbox"
          >
            {options.map((opt) => (
              <div
                key={opt}
                role="option"
                aria-selected={opt === value}
                className={`rows-per-page-option ${opt === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
