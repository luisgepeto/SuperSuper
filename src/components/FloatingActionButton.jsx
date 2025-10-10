const FloatingActionButton = ({ onClick, children, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-20 h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 ${className}`}
    >
      {children}
    </button>
  );
};

export default FloatingActionButton;