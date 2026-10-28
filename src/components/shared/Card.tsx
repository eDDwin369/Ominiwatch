import React from 'react';
import './SharedUI.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'nested' | 'compact';
}

export function Card({ children, className = '', variant = 'default', style, ...props }: CardProps) {
  const variantClass = variant === 'nested' ? 'figma-card-nested' : variant === 'compact' ? 'figma-card-compact' : '';
  return (
    <div className={`figma-card ${variantClass} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className = '', action, ...props }: CardHeaderProps) {
  return (
    <div className={`figma-card-top-bar ${className}`} {...props}>
      {children}
      {action && <div className="figma-card-actions">{action}</div>}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function CardTitle({ children, className = '', gradient = true, ...props }: CardTitleProps) {
  return (
    <h2 className={`figma-card-heading ${className}`} {...props}>
      {gradient ? <span className="brand-gradient-text">{children}</span> : children}
    </h2>
  );
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={`figma-card-body ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div className={`figma-card-footer ${className}`} {...props}>
      {children}
    </div>
  );
}
