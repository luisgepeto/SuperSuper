// Product lookup providers index
// Add new providers here to make them available for product lookups
import barcodeSpiderProvider from './barcodeSpiderProvider';

// Export all providers in priority order (first configured provider wins)
const providers = [
  barcodeSpiderProvider,
  // Add additional providers here in order of preference
];

export default providers;
