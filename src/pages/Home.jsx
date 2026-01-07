import { useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const Home = () => {
  const navigate = useNavigate();
  const {
    isOnline,
    isNetworkOnline,
    isBackendOnline,
    status,
    checkBackend
  } = useOnlineStatus();

  // Generate a GUID for the trip
  const generateGUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleGoShopping = () => {
    const tripId = generateGUID();
    navigate(`/trips?tripId=${tripId}`);
  };

  // Handle retry actions
  const handleServerRetry = () => {
    checkBackend();
  };

  const serviceWorkerSupport = 'serviceWorker' in navigator;

  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500';
    if (isNetworkOnline && !isBackendOnline) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full bg-gray-50 flex items-center justify-center overflow-hidden relative">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
          Welcome to SuperSuper
        </h1>
        <p className="text-lg text-gray-600 mt-4">
          🛒 Your trusted supermarket companion!
        </p>
        
        {/* Go Shopping Button */}
        <button
          onClick={handleGoShopping}
          className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow-md transition-colors duration-200"
        >
          Go shopping!
        </button>
        
        {/* Enhanced Status Panel */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className={`inline-block w-4 h-4 rounded-full ${getStatusColor()}`}></span>
            <span className="text-lg font-medium">
              System Status: {status.overall === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {/* Detailed Status */}
          <div className="space-y-3 text-sm">
            {/* Service Worker Row */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 font-medium">Service Worker:</span>
                <div className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${serviceWorkerSupport ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={serviceWorkerSupport ? 'text-green-600' : 'text-red-600'}>
                    {serviceWorkerSupport ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
              </div>
            </div>

            {/* Internet Status Row */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 font-medium">Internet:</span>
                <div className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${isNetworkOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className={isNetworkOnline ? 'text-green-600' : 'text-red-600'}>
                    {status.network}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Server Status Row */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-600 font-medium">SuperSuper Server:</span>
                <div className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                  <span className={isBackendOnline ? 'text-green-600' : 'text-orange-600'}>
                    {status.backend}
                  </span>
                </div>
              </div>
              {!isBackendOnline && (
                <button
                  onClick={handleServerRetry}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-medium transition-colors"
                >
                  check server
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;