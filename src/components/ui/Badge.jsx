const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-warm-100 text-warm-700',
    primary: 'bg-primary-100 text-primary-700',
    accent: 'bg-accent-100 text-accent-700',
    success: 'bg-success-light text-success-dark',
    warning: 'bg-warning-light text-warning-dark',
    error: 'bg-error-light text-error-dark',
    outline: 'border border-warm-300 text-warm-600 bg-transparent',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    primary: 'bg-primary-500',
    accent: 'bg-accent-500',
    default: 'bg-warm-500',
  };

  const getDotColor = () => {
    return dotColors[variant] || dotColors.default;
  };

  const dotStyles = dot ? 'gap-1.5' : '';

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${dotStyles} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
