import { API_TIMEOUTS } from '../constants';

// API service for backend communication and health checks
class ApiService {
  constructor() {
    this.baseUrl = this.getBaseUrl();
    this.healthCheckInterval = null;
    this.isBackendAvailable = true;
    this.lastHealthCheck = null;
    this.healthCheckCallbacks = new Set();
  }

  getBaseUrl() {
    // In development, use localhost:5000
    // In production, use the same host but port 5000 or environment variable
    if (process.env.NODE_ENV === 'production') {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    return 'http://localhost:5000';
  }

  // Subscribe to backend status changes
  onBackendStatusChange(callback) {
    this.healthCheckCallbacks.add(callback);
    // Return unsubscribe function
    return () => {
      this.healthCheckCallbacks.delete(callback);
    };
  }

  // Notify all subscribers about backend status change
  notifyStatusChange(isAvailable, error = null) {
    if (this.isBackendAvailable !== isAvailable) {
      this.isBackendAvailable = isAvailable;
      this.healthCheckCallbacks.forEach(callback => {
        try {
          callback(isAvailable, error);
        } catch (err) {
          console.error('Error in backend status callback:', err);
        }
      });
    }
  }

  // Check if backend is healthy
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.HEALTH_CHECK);

      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      this.lastHealthCheck = new Date();

      if (response.ok) {
        this.notifyStatusChange(true);
        return { success: true, status: response.status };
      } else {
        throw new Error(`Backend returned ${response.status}`);
      }
    } catch (error) {
      this.notifyStatusChange(false, error);
      console.warn('Backend health check failed:', error.message);
      return { 
        success: false, 
        error: error.message,
        isTimeout: error.name === 'AbortError'
      };
    }
  }

  // Start periodic health checks
  startHealthChecks(intervalMs = 30000) { // Default: every 30 seconds
    this.stopHealthChecks(); // Clear any existing interval
    
    // Initial health check
    this.checkHealth();
    
    // Set up periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);

    console.log(`Started backend health checks every ${intervalMs/1000} seconds`);
  }

  // Stop periodic health checks
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('Stopped backend health checks');
    }
  }

  // Generic API request wrapper with backend status handling
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.REQUEST);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // If request succeeds, backend is available
      this.notifyStatusChange(true);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // If request fails, backend might be unavailable
      this.notifyStatusChange(false, error);
      
      throw {
        error: error.message,
        isBackendUnavailable: true,
        isTimeout: error.name === 'AbortError',
        canRetry: true
      };
    }
  }

  // Specific API methods (to be expanded as needed)
  async getProducts() {
    return this.request('/api/products');
  }

  async getProduct(id) {
    return this.request(`/api/products/${id}`);
  }

  async searchProducts(query) {
    return this.request(`/api/products/search?q=${encodeURIComponent(query)}`);
  }

  // Get current backend status
  getBackendStatus() {
    return {
      isAvailable: this.isBackendAvailable,
      lastCheck: this.lastHealthCheck,
      baseUrl: this.baseUrl
    };
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;