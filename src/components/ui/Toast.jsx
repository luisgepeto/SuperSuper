import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

const TOAST_DURATION = 5000; // 5 seconds - reasonable time to read and decide to undo

const Toast = ({ 
  isVisible, 
  message, 
  onUndo, 
  onClose,
  duration = TOAST_DURATION 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setProgress(100);
      
      // Animate progress bar
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (remaining <= 0) {
          clearInterval(progressInterval);
        }
      }, 50);

      // Auto-dismiss timer
      const dismissTimer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 200); // Wait for exit animation
      }, duration);

      return () => {
        clearTimeout(dismissTimer);
        clearInterval(progressInterval);
      };
    }
  }, [isVisible, duration, onClose]);

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    }
    setIsAnimating(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 200);
  };

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 200);
  };

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div 
      className={`fixed bottom-24 left-4 right-4 z-50 flex justify-center transition-all duration-200 ease-out ${
        isAnimating 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-md w-full bg-warm-800 text-white rounded-xl shadow-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-warm-700">
          <div 
            className="h-full bg-primary-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Content */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium flex-1 truncate">
            {message}
          </p>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {onUndo && (
              <button
                onClick={handleUndo}
                className="px-3 py-1.5 text-sm font-semibold text-primary-300 hover:text-primary-200 hover:bg-warm-700 rounded-lg transition-colors"
                aria-label="Undo removal"
              >
                Undo
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 text-warm-400 hover:text-white hover:bg-warm-700 rounded-lg transition-colors"
              aria-label="Dismiss notification"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Toast;
