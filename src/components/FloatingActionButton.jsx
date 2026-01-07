const FloatingActionButton = ({ onClick, children, size = 'large', className = '' }) => {
  // Dynamic sizing based on size prop
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16', 
    large: 'w-20 h-20'
  };
  
  const buttonSize = sizeClasses[size] || sizeClasses.large;
  
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 right-6 ${buttonSize} bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 ${className}`}
    >
      {children}
    </button>
  );
};

export default FloatingActionButton;