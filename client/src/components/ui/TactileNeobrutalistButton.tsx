import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'purple' | 'red' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface TactileNeobrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TactileNeobrutalistButton: React.FC<TactileNeobrutalistButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-headline font-black uppercase tracking-wider transition-all duration-150 select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#FE4E1A] text-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F534A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#0F534A]',
    secondary:
      'bg-[#0F534A] text-white border-3 border-[#4717AE] shadow-[4px_4px_0px_#4717AE] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#4717AE] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#4717AE]',
    purple:
      'bg-[#4717AE] text-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#FE4E1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#FE4E1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#FE4E1A]',
    red:
      'bg-[#F4002C] text-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#4717AE] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#4717AE] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#4717AE]',
    outline:
      'bg-white text-[#121316] border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#0F534A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#0F534A]',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-7 py-3.5 gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : leftIcon ? (
        <span className="flex items-center">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {rightIcon && !isLoading && <span className="flex items-center">{rightIcon}</span>}
    </button>
  );
};
