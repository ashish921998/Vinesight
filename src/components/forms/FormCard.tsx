"use client";

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const variantStyles = {
  default: 'border-border',
  success: 'border-green-200 bg-green-50/50',
  warning: 'border-yellow-200 bg-yellow-50/50',
  error: 'border-red-200 bg-red-50/50',
  info: 'border-blue-200 bg-blue-50/50'
};

const variantTitleStyles = {
  default: 'text-foreground',
  success: 'text-green-800',
  warning: 'text-yellow-800',
  error: 'text-red-800',
  info: 'text-blue-800'
};

export function FormCard({ 
  title, 
  description, 
  icon, 
  children, 
  className,
  variant = 'default' 
}: FormCardProps) {
  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader>
        <CardTitle className={cn(
          "flex items-center gap-2",
          variantTitleStyles[variant]
        )}>
          {icon && <span className="shrink-0">{icon}</span>}
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}