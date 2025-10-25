import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'large',
  icon: Icon,
  onClick,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'flex items-center justify-center gap-3 rounded-xl font-semibold transition-all touch-area disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-campo-green-600 text-white hover:bg-campo-green-700 active:scale-95 shadow-lg',
    secondary: 'bg-campo-brown-500 text-white hover:bg-campo-brown-600 active:scale-95 shadow-lg',
    outline: 'bg-white text-campo-green-600 border-2 border-campo-green-600 hover:bg-campo-green-50 active:scale-95',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95 shadow-lg'
  };

  const sizes = {
    small: 'px-6 py-3 text-base min-h-[60px]',
    large: 'px-8 py-6 text-xl min-h-[80px] min-w-[160px]'
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'large' ? 'w-8 h-8' : 'w-6 h-6'} />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
