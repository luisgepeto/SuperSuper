// Data storage service for export/import/clear operations
// Manages all SuperSuper localStorage data

// All localStorage keys used by the application
const STORAGE_KEYS = {
  TRIPS: 'supersuper_trips',
  API_KEYS: 'supersuper_api_keys'
};

class DataStorage {
  // Get all storage keys used by the app
  getStorageKeys() {
    return Object.values(STORAGE_KEYS);
  }

  // Export all app data as a JSON object
  exportAllData() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {}
    };

    try {
      for (const [keyName, storageKey] of Object.entries(STORAGE_KEYS)) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          data.data[storageKey] = JSON.parse(stored);
        }
      }
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  // Download exported data as a JSON file
  downloadData() {
    const data = this.exportAllData();
    if (!data) {
      return false;
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `supersuper-data-${date}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  }

  // Clear all app data from localStorage
  clearAllData() {
    try {
      for (const storageKey of Object.values(STORAGE_KEYS)) {
        localStorage.removeItem(storageKey);
      }
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Check if any app data exists in localStorage
  hasExistingData() {
    try {
      for (const storageKey of Object.values(STORAGE_KEYS)) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Check if the stored data has any content
          if (typeof parsed === 'object' && parsed !== null) {
            if (Array.isArray(parsed) && parsed.length > 0) {
              return true;
            }
            if (!Array.isArray(parsed) && Object.keys(parsed).length > 0) {
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking for existing data:', error);
      return false;
    }
  }

  // Validate imported data format
  validateImportData(data) {
    const result = {
      isValid: false,
      errors: [],
      summary: {
        trips: 0,
        apiKeys: 0
      }
    };

    // Check basic structure
    if (!data || typeof data !== 'object') {
      result.errors.push('Invalid data format: expected a JSON object');
      return result;
    }

    if (!data.data || typeof data.data !== 'object') {
      result.errors.push('Invalid data format: missing "data" property');
      return result;
    }

    // Validate and count trips (trips are stored as an object with trip IDs as keys)
    if (data.data[STORAGE_KEYS.TRIPS]) {
      const trips = data.data[STORAGE_KEYS.TRIPS];
      if (typeof trips !== 'object' || Array.isArray(trips)) {
        result.errors.push('Invalid trips format: expected an object with trip IDs as keys');
      } else {
        result.summary.trips = Object.keys(trips).length;
      }
    }

    // Validate and count API keys (API keys are stored as an object with key names as keys)
    if (data.data[STORAGE_KEYS.API_KEYS]) {
      const apiKeys = data.data[STORAGE_KEYS.API_KEYS];
      if (typeof apiKeys !== 'object' || Array.isArray(apiKeys)) {
        result.errors.push('Invalid API keys format: expected an object with key names as keys');
      } else {
        result.summary.apiKeys = Object.keys(apiKeys).length;
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Import data from a validated JSON object
  importData(data) {
    try {
      const validation = this.validateImportData(data);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // Import each storage key
      for (const storageKey of Object.values(STORAGE_KEYS)) {
        if (data.data[storageKey]) {
          localStorage.setItem(storageKey, JSON.stringify(data.data[storageKey]));
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, errors: ['Failed to import data: ' + error.message] };
    }
  }

  // Read and parse a file as JSON
  async readFileAsJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

// Create singleton instance
const dataStorage = new DataStorage();

export default dataStorage;
