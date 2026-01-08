// Product lookup service - aggregates multiple lookup providers
// Providers can be added in productLookupProviders/index.js
import providers from './productLookupProviders';

class ProductLookupService {
  constructor() {
    this.providers = providers;
  }

  // Get all configured providers
  getConfiguredProviders() {
    return this.providers.filter((provider) => provider.isConfigured());
  }

  // Look up product information by barcode using the first configured provider
  async lookupProduct(barcode) {
    const configuredProviders = this.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      return { success: false, error: 'No lookup providers configured' };
    }

    // Try each configured provider in order until one succeeds
    for (const provider of configuredProviders) {
      const result = await provider.lookup(barcode);
      if (result.success) {
        return {
          success: true,
          product: result.product,
          provider: provider.name,
        };
      }
    }

    return { success: false, error: 'Product not found in any provider' };
  }

  // Look up product from all configured providers and merge results
  async lookupProductFromAll(barcode) {
    const configuredProviders = this.getConfiguredProviders();
    
    if (configuredProviders.length === 0) {
      return { success: false, error: 'No lookup providers configured' };
    }

    const results = await Promise.all(
      configuredProviders.map(async (provider) => {
        const result = await provider.lookup(barcode);
        return { provider: provider.name, ...result };
      })
    );

    // Find the first successful result
    const successfulResults = results.filter((r) => r.success);
    
    if (successfulResults.length === 0) {
      return { success: false, error: 'Product not found in any provider', results };
    }

    // Merge all successful results into a single product object
    // Earlier providers in the list take precedence for conflicting fields
    const mergedProduct = this.mergeProductResults(successfulResults);

    return {
      success: true,
      product: mergedProduct,
      providers: successfulResults.map((r) => r.provider),
    };
  }

  // Merge product results from multiple providers
  // First non-null value wins for each field
  mergeProductResults(successfulResults) {
    const merged = {
      title: null,
      upc: null,
      ean: null,
      asin: null,
      brand: null,
      manufacturer: null,
      model: null,
      mpn: null,
      category: null,
      parentCategory: null,
      color: null,
      size: null,
      weight: null,
      image: null,
      description: null,
      isAdult: false,
      lowestPrice: null,
      highestPrice: null,
      stores: [],
    };

    for (const result of successfulResults) {
      const product = result.product;
      if (!product) continue;

      // Merge scalar fields (first non-null value wins)
      for (const key of Object.keys(merged)) {
        if (key === 'stores') continue; // Handle arrays separately
        if (key === 'isAdult') {
          merged.isAdult = merged.isAdult || product.isAdult;
          continue;
        }
        if (merged[key] === null && product[key] != null) {
          merged[key] = product[key];
        }
      }

      // Merge stores arrays
      if (Array.isArray(product.stores)) {
        merged.stores = [...merged.stores, ...product.stores];
      }
    }

    return merged;
  }
}

// Create singleton instance
const productLookupService = new ProductLookupService();

export default productLookupService;

