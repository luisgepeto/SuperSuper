const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {icon && (
        <div className="mb-4 p-4 bg-warm-100 rounded-full">
          <div className="text-warm-400">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg font-semibold text-warm-800 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-warm-500 max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
