const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
  className = '',
}) => {
  const baseStyles = 'rounded-2xl transition-smooth';
  
  const variants = {
    default: 'bg-white shadow-card border border-warm-100',
    elevated: 'bg-white shadow-soft',
    outlined: 'bg-white border-2 border-warm-200',
    filled: 'bg-warm-50',
    gradient: 'bg-gradient-to-br from-primary-50 to-warm-50 border border-primary-100',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  };

  const hoverStyles = hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' : '';
  const clickable = onClick ? 'cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${clickable} ${className}`}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-warm-900 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-warm-600 mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-warm-100 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
