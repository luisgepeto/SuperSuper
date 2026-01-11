// Shared constants used across the application

// Validation patterns
export const VALIDATION_PATTERNS = {
  PRICE: /^\d*\.?\d{0,2}$/,
  QUANTITY: /^\d+$/,
};

// Image compression defaults
export const IMAGE_COMPRESSION = {
  MAX_WIDTH: 200,
  MAX_HEIGHT: 200,
  QUALITY: 0.7,
  VIDEO_CAPTURE_QUALITY: 0.9,
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  REMOVAL: 300,
};

// API timeouts (in milliseconds)
export const API_TIMEOUTS = {
  HEALTH_CHECK: 5000,
  REQUEST: 10000,
};

// Health check intervals (in milliseconds)
export const HEALTH_CHECK_INTERVAL = 30000;

// LocalStorage keys
export const STORAGE_KEYS = {
  TRIPS: 'supersuper_trips',
  API_KEYS: 'supersuper_api_keys',
};
