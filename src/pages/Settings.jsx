import { useOnlineStatus } from '../hooks/useOnlineStatus';

const Settings = () => {
  const {
    isOnline,
    isNetworkOnline,
    isBackendOnline,
    status,
    checkBackend
  } = useOnlineStatus();

  const serviceWorkerSupport = 'serviceWorker' in navigator;

  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500';
    if (isNetworkOnline && !isBackendOnline) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleServerRetry = () => {
    checkBackend();
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-20">
      <div className="min-h-full flex flex-col py-8 px-4">
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
            Settings
          </h1>

          {/* System Status Section */}
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center space-x-2 mb-4">
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
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* API Keys Section */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              API Keys
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key 1
                </label>
                <input
                  type="text"
                  placeholder="Enter API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key 2
                </label>
                <input
                  type="text"
                  placeholder="Enter API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              
              <p className="text-sm text-gray-500">
                API key functionality coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
