// API key storage service using localStorage for persistence
const API_KEYS_STORAGE_KEY = 'supersuper_api_keys';

class ApiKeyStorage {
  // Get all API keys from localStorage
  getAllKeys() {
    try {
      const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error(`Error reading API keys from localStorage (key: ${API_KEYS_STORAGE_KEY}):`, error);
      return {};
    }
  }

  // Save all API keys to localStorage
  saveAllKeys(keys) {
    if (typeof keys !== 'object' || keys === null || Array.isArray(keys)) {
      console.error('Invalid keys parameter: expected an object');
      return;
    }
    try {
      localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error(`Error saving API keys to localStorage (key: ${API_KEYS_STORAGE_KEY}):`, error);
    }
  }

  // Get a specific API key by name
  getKey(keyName) {
    const keys = this.getAllKeys();
    return keys[keyName] || '';
  }

  // Set a specific API key
  setKey(keyName, value) {
    const keys = this.getAllKeys();
    keys[keyName] = value;
    this.saveAllKeys(keys);
  }

  // Remove a specific API key
  removeKey(keyName) {
    const keys = this.getAllKeys();
    delete keys[keyName];
    this.saveAllKeys(keys);
  }
}

// Create singleton instance
const apiKeyStorage = new ApiKeyStorage();

export default apiKeyStorage;
