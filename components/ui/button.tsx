import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50
          ${variant === 'default' ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200' : ''}
          ${variant === 'destructive' ? 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90' : ''}
          ${variant === 'outline' ? 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground' : ''}
          ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80' : ''}
          ${variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' : ''}
          ${variant === 'link' ? 'text-primary underline-offset-4 hover:underline' : ''}
          ${size === 'default' ? 'h-9 px-4 py-2' : ''}
          ${size === 'sm' ? 'h-8 px-3 text-xs' : ''}
          ${size === 'lg' ? 'h-10 px-8' : ''}
          ${size === 'icon' ? 'h-9 w-9' : ''}
          ${className}`}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
