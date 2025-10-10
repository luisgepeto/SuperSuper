import { useOnlineStatus } from './hooks/useOnlineStatus';
import OfflineIndicator from './components/OfflineIndicator';

const App = () => {
  const {
    isOnline,
    isNetworkOnline,
    isBackendOnline,
    status,
    checkBackend
  } = useOnlineStatus();

  // Handle retry actions
  const handleServerRetry = () => {
    checkBackend();
  };

  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500';
    if (isNetworkOnline && !isBackendOnline) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <OfflineIndicator 
        isOnline={isOnline}
        isNetworkOnline={isNetworkOnline}
        isBackendOnline={isBackendOnline}
      />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Welcome to SuperSuper
          </h1>
          <p className="text-lg text-gray-600 mt-4">
            🛒 Your trusted supermarket companion!
          </p>
          
          
          {/* Enhanced Status Panel */}
          <div className="mt-6 p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className={`inline-block w-4 h-4 rounded-full ${getStatusColor()}`}></span>
              <span className="text-lg font-medium">
                System Status: {status.overall === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Detailed Status */}
            <div className="space-y-3 text-sm">
              {/* Internet Status Row */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
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
                    className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-colors"
                  >
                    check server
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;