import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './SharedUI.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  width?: string;
  height?: string;
  className?: string;
  redCloseBtn?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  icon,
  headerActions,
  children, 
  footer, 
  maxWidth = '520px',
  width,
  height,
  className = '',
  redCloseBtn = true
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasStandardHeader = Boolean(icon || subtitle || headerActions);

  return (
    <div className="figma-modal-backdrop" onClick={onClose}>
      <div 
        className={`figma-modal-surface modal-standard-surface ${className}`} 
        style={{ maxWidth, width, height }} 
        onClick={(e) => e.stopPropagation()}
      >
        {hasStandardHeader ? (
          <div className="modal-standard-header">
            <div className="modal-header-left">
              {icon && (
                <div className="modal-header-icon-badge">
                  {icon}
                </div>
              )}
              <div className="modal-header-title-wrap">
                {typeof title === 'string' ? (
                  <h3 className="modal-header-title">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <div className="modal-header-subtitle">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-header-right">
              {headerActions}
              {redCloseBtn ? (
                <button 
                  type="button" 
                  className="modal-red-close-btn" 
                  onClick={onClose} 
                  aria-label="Close modal"
                  title="Close"
                >
                  <X size={16} />
                </button>
              ) : (
                <button type="button" className="figma-modal-close-btn" onClick={onClose} aria-label="Close modal">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="figma-modal-header">
            {typeof title === 'string' ? (
              <h3 className="figma-modal-title"><span className="brand-gradient-text">{title}</span></h3>
            ) : (
              title
            )}
            {redCloseBtn ? (
              <button 
                type="button" 
                className="modal-red-close-btn" 
                onClick={onClose} 
                aria-label="Close modal"
                title="Close"
              >
                <X size={16} />
              </button>
            ) : (
              <button type="button" className="figma-modal-close-btn" onClick={onClose} aria-label="Close modal">
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div className="figma-modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>

        {footer && (
          <div className="figma-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
