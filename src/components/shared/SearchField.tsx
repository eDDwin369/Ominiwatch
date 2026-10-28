import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import './SharedUI.css';

export interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  expandable?: boolean;
}

export function SearchField({
  value,
  onChange,
  onClear,
  placeholder = 'Search data...',
  className = '',
  expandable = true,
  ...props
}: SearchFieldProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => Boolean(value));
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync expanded state if external value changes
  useEffect(() => {
    if (value && !isExpanded) {
      setIsExpanded(true);
    }
  }, [value]);

  // Click outside to collapse if empty
  useEffect(() => {
    if (!expandable || !isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!value || value.trim() === '') {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandable, isExpanded, value]);

  const handleOpen = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange({ target: { value: '' } } as any);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (value) {
        handleClear();
      } else if (expandable) {
        setIsExpanded(false);
      }
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  if (expandable && !isExpanded && !value) {
    return (
      <div className={`figma-search-expandable ${className}`} ref={containerRef}>
        <button
          type="button"
          onClick={handleOpen}
          className="figma-search-btn-trigger"
          aria-label="Expand search"
          title="Search"
        >
          <Search size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className={`figma-search-expandable ${className}`} ref={containerRef}>
      <div className="figma-search-pill-expanded">
        <div className="figma-search-pill-icon">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="figma-search-pill-input"
          {...props}
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="figma-search-pill-clear"
            aria-label="Clear search"
            title="Clear search"
          >
            <X size={14} />
          </button>
        ) : expandable ? (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="figma-search-pill-clear"
            aria-label="Close search"
            title="Close search"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

