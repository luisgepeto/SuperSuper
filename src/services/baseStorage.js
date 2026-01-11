// Base class for localStorage operations
class BaseStorage {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  // Get data from localStorage
  getData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultValue();
    } catch (error) {
      console.error(`Error reading ${this.storageKey} from localStorage:`, error);
      return this.getDefaultValue();
    }
  }

  // Save data to localStorage
  saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving ${this.storageKey} to localStorage:`, error);
      return false;
    }
  }

  // Clear data from localStorage
  clearData() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error(`Error clearing ${this.storageKey} from localStorage:`, error);
      return false;
    }
  }

  // Override this in subclasses to provide default values
  getDefaultValue() {
    return {};
  }
}

export default BaseStorage;
