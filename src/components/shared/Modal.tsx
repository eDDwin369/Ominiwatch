import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './SharedUI.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '520px' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="figma-modal-backdrop" onClick={onClose}>
      <div 
        className="figma-modal-surface" 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="figma-modal-header">
          {typeof title === 'string' ? (
            <h3 className="figma-modal-title"><span className="brand-gradient-text">{title}</span></h3>
          ) : (
            title
          )}
          <button type="button" className="figma-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="figma-modal-body">
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
