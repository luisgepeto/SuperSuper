import { useEffect } from 'react';
import { CheckIcon, AlertTriangleIcon, CloseIcon } from './Icons';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-primary-600 text-white'
  };

  const Icon = type === 'success' ? CheckIcon : AlertTriangleIcon;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
      <div className={`${typeStyles[type]} rounded-xl shadow-lg p-4 flex items-center gap-3`}>
        <div className="flex-shrink-0">
          <Icon size={20} />
        </div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close notification"
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
