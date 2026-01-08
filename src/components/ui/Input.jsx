const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  disabled = false,
  required = false,
  icon,
  className = '',
  inputClassName = '',
  id,
}) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-warm-700">
          {label}
          {required && <span className="text-error-DEFAULT ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warm-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`
            w-full px-4 py-3 
            bg-white border rounded-xl
            text-warm-900 placeholder-warm-400
            transition-smooth
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-warm-50 disabled:text-warm-500 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-error-DEFAULT ring-1 ring-error-DEFAULT' : 'border-warm-200 hover:border-warm-300'}
            ${inputClassName}
          `}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="text-sm text-warm-500">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-error-DEFAULT" role="alert">{error}</p>
      )}
    </div>
  );
};

export default Input;
