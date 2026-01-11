import BaseStorage from './baseStorage';
import { STORAGE_KEYS } from '../constants';

// API key storage service using localStorage for persistence
class ApiKeyStorage extends BaseStorage {
  constructor() {
    super(STORAGE_KEYS.API_KEYS);
  }

  // Get all API keys from localStorage
  getAllKeys() {
    return this.getData();
  }

  // Save all API keys to localStorage
  saveAllKeys(keys) {
    if (typeof keys !== 'object' || keys === null || Array.isArray(keys)) {
      console.error('Invalid keys parameter: expected an object');
      return;
    }
    this.saveData(keys);
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
