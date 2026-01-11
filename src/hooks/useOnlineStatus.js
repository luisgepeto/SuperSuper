import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { HEALTH_CHECK_INTERVAL } from '../constants';

export const useOnlineStatus = () => {
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState(true); // Assume backend is available initially
  const [lastBackendError, setLastBackendError] = useState(null);

  // Combined status: both network AND backend must be available
  const isFullyOnline = networkStatus && backendStatus;

  useEffect(() => {
    // Network status handlers
    const handleNetworkOnline = () => {
      console.log('Network: Online');
      setNetworkStatus(true);
      // When network comes back, check backend immediately
      apiService.checkHealth();
    };

    const handleNetworkOffline = () => {
      console.log('Network: Offline');
      setNetworkStatus(false);
    };

    // Backend status handler
    const handleBackendStatusChange = (isAvailable, error) => {
      console.log('Backend:', isAvailable ? 'Available' : 'Unavailable', error ? `(${error.message})` : '');
      setBackendStatus(isAvailable);
      setLastBackendError(isAvailable ? null : error);
    };

    // Set up event listeners
    window.addEventListener('online', handleNetworkOnline);
    window.addEventListener('offline', handleNetworkOffline);
    
    // Subscribe to backend status changes
    const unsubscribeBackend = apiService.onBackendStatusChange(handleBackendStatusChange);

    // Start health checks when component mounts
    apiService.startHealthChecks(HEALTH_CHECK_INTERVAL);

    return () => {
      window.removeEventListener('online', handleNetworkOnline);
      window.removeEventListener('offline', handleNetworkOffline);
      unsubscribeBackend();
      apiService.stopHealthChecks();
    };
  }, []);

  return {
    // Individual statuses
    isNetworkOnline: networkStatus,
    isBackendOnline: backendStatus,
    lastBackendError,
    
    // Combined status (for backward compatibility)
    isOnline: isFullyOnline,
    
    // Detailed status for UI
    status: {
      network: networkStatus ? 'online' : 'offline',
      backend: backendStatus ? 'online' : 'offline',
      overall: isFullyOnline ? 'online' : 'offline'
    },
    
    // Helper methods
    getStatusMessage: () => {
      if (!networkStatus) return 'No internet connection';
      if (!backendStatus) return 'Server unavailable';
      return 'All systems online';
    },
    
    // Force a backend health check
    checkBackend: () => apiService.checkHealth()
  };
};