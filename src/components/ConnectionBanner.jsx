import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOffIcon, ServerIcon } from './ui/Icons';

const ConnectionBanner = () => {
  const { isOnline, isNetworkOnline, isBackendOnline } = useOnlineStatus();

  // Don't show banner if everything is online
  if (isOnline) {
    return null;
  }

  const getConfig = () => {
    if (!isNetworkOnline) {
      return {
        icon: WifiOffIcon,
        message: 'No internet connection',
        bgColor: 'bg-error-DEFAULT',
      };
    }
    if (!isBackendOnline) {
      return {
        icon: ServerIcon,
        message: 'Server unavailable',
        bgColor: 'bg-warning-DEFAULT',
      };
    }
    return {
      icon: WifiOffIcon,
      message: 'Connection issue',
      bgColor: 'bg-error-DEFAULT',
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} text-white px-4 py-2 safe-area-top`}>
      <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
        <Icon size={16} />
        <span className="text-sm font-medium">{config.message}</span>
      </div>
    </div>
  );
};

export default ConnectionBanner;
