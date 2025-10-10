const OfflineIndicator = ({ 
  isOnline, 
  isNetworkOnline, 
  isBackendOnline
}) => {
  if (isOnline) {
    return null; // Don't show anything when fully online
  }

  // Determine the appropriate styling and message based on what's offline
  const getIndicatorStyle = () => {
    if (!isNetworkOnline) {
      return 'bg-red-600'; // Network is down - most critical
    }
    if (!isBackendOnline) {
      return 'bg-orange-500'; // Backend is down - less critical than network
    }
    return 'bg-red-500'; // Fallback
  };

  const getIndicatorIcon = () => {
    if (!isNetworkOnline) return '📡';
    if (!isBackendOnline) return '🔧';
    return '⚠️';
  };

  const getMainMessage = () => {
    if (!isNetworkOnline) return 'No Internet Connection';
    if (!isBackendOnline) return 'Server Unavailable';
    return 'System Offline';
  };

  const getSubMessage = () => {
    if (!isNetworkOnline) return 'Check your WiFi or mobile data';
    if (!isBackendOnline) return 'SuperSuper server is not responding';
    return 'Some features may be limited';
  };

  return (
    <div className={`fixed top-0 left-0 right-0 ${getIndicatorStyle()} text-white px-4 py-3 text-center z-50 shadow-lg`}>
      <div className="flex items-center justify-center space-x-3">
        <span className="text-lg">{getIndicatorIcon()}</span>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
          <span className="font-medium">{getMainMessage()}</span>
          <span className="text-sm opacity-90">
            {getSubMessage()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;