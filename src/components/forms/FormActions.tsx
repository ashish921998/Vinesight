"use client";

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormActionsProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  resetLabel?: string;
  isLoading?: boolean;
  isSubmitDisabled?: boolean;
  className?: string;
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  layout?: 'horizontal' | 'vertical';
}

export function FormActions({
  onSubmit,
  onCancel,
  onReset,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  resetLabel = 'Reset',
  isLoading = false,
  isSubmitDisabled = false,
  className,
  submitVariant = 'default',
  layout = 'horizontal'
}: FormActionsProps) {
  const containerClassName = cn(
    "flex gap-2",
    layout === 'vertical' ? 'flex-col' : 'flex-row justify-end',
    className
  );

  return (
    <div className={containerClassName}>
      {onReset && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onReset}
          disabled={isLoading}
          className={layout === 'vertical' ? 'w-full' : ''}
        >
          {resetLabel}
        </Button>
      )}
      
      {onCancel && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
          className={layout === 'vertical' ? 'w-full' : ''}
        >
          {cancelLabel}
        </Button>
      )}
      
      {onSubmit && (
        <Button 
          type="submit" 
          variant={submitVariant}
          onClick={onSubmit}
          disabled={isLoading || isSubmitDisabled}
          className={layout === 'vertical' ? 'w-full' : ''}
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      )}
    </div>
  );
}