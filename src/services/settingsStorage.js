/**
 * settingsStorage.js
 * 
 * Manages application settings stored in localStorage
 */

const STORAGE_KEY = 'supersuper_settings';

const DEFAULT_SETTINGS = {
  experimentalFeatures: {
    semanticSearch: false
  }
};

class SettingsStorage {
  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new settings exist
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          experimentalFeatures: {
            ...DEFAULT_SETTINGS.experimentalFeatures,
            ...(parsed.experimentalFeatures || {})
          }
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Get a setting value
   * @param {string} path - Dot-notation path (e.g., 'experimentalFeatures.semanticSearch')
   */
  get(path) {
    const keys = path.split('.');
    let value = this.settings;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  }

  /**
   * Set a setting value
   * @param {string} path - Dot-notation path (e.g., 'experimentalFeatures.semanticSearch')
   * @param {*} value - Value to set
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let obj = this.settings;
    
    for (const key of keys) {
      if (!(key in obj)) {
        obj[key] = {};
      }
      obj = obj[key];
    }
    
    obj[lastKey] = value;
    this.saveSettings();
  }

  /**
   * Check if semantic search is enabled
   */
  isSemanticSearchEnabled() {
    return this.get('experimentalFeatures.semanticSearch') === true;
  }

  /**
   * Enable or disable semantic search
   */
  setSemanticSearchEnabled(enabled) {
    this.set('experimentalFeatures.semanticSearch', enabled);
  }

  /**
   * Get all experimental features settings
   */
  getExperimentalFeatures() {
    return this.get('experimentalFeatures') || DEFAULT_SETTINGS.experimentalFeatures;
  }
}

const settingsStorage = new SettingsStorage();

export default settingsStorage;
