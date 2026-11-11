import React from 'react';

type BadgeVariant = 'wholesale' | 'retail' | 'purchase' | 'success' | 'warning' | 'danger' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  wholesale: 'bg-blue-100 text-blue-700',
  retail: 'bg-green-100 text-green-700',
  purchase: 'bg-violet-100 text-violet-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  default: 'bg-slate-100 text-slate-600',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
