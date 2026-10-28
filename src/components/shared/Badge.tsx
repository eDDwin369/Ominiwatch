import React from 'react';
import './SharedUI.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  return (
    <span className={`figma-badge figma-badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
