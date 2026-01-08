// Barcode Spider API provider for product lookups
// API documentation: https://www.barcodespider.com/
import apiKeyStorage from '../apiKeyStorage';

const BARCODE_SPIDER_BASE_URL = 'https://api.barcodespider.com/v1/lookup';
const API_KEY_NAME = 'barcode-spider';

// Map Barcode Spider API response to standardized product format
const mapToProductDetails = (data) => {
  const attrs = data.item_attributes || {};
  
  return {
    // Core identification
    title: attrs.title || null,
    upc: attrs.upc || null,
    ean: attrs.ean || null,
    asin: attrs.asin || null,
    
    // Product details
    brand: attrs.brand || null,
    manufacturer: attrs.manufacturer || null,
    model: attrs.model || null,
    mpn: attrs.mpn || null,
    
    // Categorization
    category: attrs.category || null,
    parentCategory: attrs.parent_category || null,
    
    // Physical attributes
    color: attrs.color || null,
    size: attrs.size || null,
    weight: attrs.weight || null,
    
    // Media
    image: attrs.image || null,
    
    // Additional info
    description: attrs.description || null,
    isAdult: attrs.is_adult === '1',
    
    // Pricing (from API response)
    lowestPrice: attrs.lowest_price || null,
    highestPrice: attrs.highest_price || null,
    
    // Store availability
    stores: (data.Stores || []).map((store) => ({
      name: store.store_name,
      title: store.title,
      image: store.image,
      price: store.price,
      currency: store.currency,
      link: store.link,
      updated: store.updated,
    })),
  };
};

const barcodeSpiderProvider = {
  name: 'Barcode Spider',
  
  // Check if this provider is configured and available
  isConfigured() {
    const apiKey = apiKeyStorage.getKey(API_KEY_NAME);
    return Boolean(apiKey);
  },

  // Look up product information by barcode
  async lookup(barcode) {
    const apiKey = apiKeyStorage.getKey(API_KEY_NAME);
    
    if (!apiKey) {
      return { success: false, error: 'No API key configured' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const url = `${BARCODE_SPIDER_BASE_URL}?token=${encodeURIComponent(apiKey)}&upc=${encodeURIComponent(barcode)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Check if the API returned a successful response
      if (data.item_response?.code === 200 && data.item_attributes?.title) {
        const productDetails = mapToProductDetails(data);
        
        return {
          success: true,
          product: productDetails,
        };
      }

      return { success: false, error: 'Product not found' };
    } catch (error) {
      console.warn('Barcode Spider lookup failed:', error.message);
      return {
        success: false,
        error: error.name === 'AbortError' ? 'Request timed out' : error.message,
      };
    }
  },
};

export default barcodeSpiderProvider;
