import { Link, useLocation } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const StatusBar = () => {
  const location = useLocation();
  const {
    isOnline,
    isNetworkOnline
  } = useOnlineStatus();

  const isHomePage = location.pathname === '/';

  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500';
    if (!isNetworkOnline) return 'bg-red-600';
    return 'bg-orange-500';
  };

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (!isNetworkOnline) return 'Offline';
    return 'Server Offline';
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${getStatusColor()} px-4 py-3 flex justify-between items-center z-50`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-white">{getStatusText()}</span>
      </div>
      {isHomePage ? (
        <Link 
          to="/settings"
          className="text-sm font-medium text-white hover:text-gray-200"
        >
          Settings
        </Link>
      ) : (
        <Link 
          to="/"
          className="text-sm font-medium text-white hover:text-gray-200"
        >
          Home
        </Link>
      )}
    </div>
  );
};

export default StatusBar;
