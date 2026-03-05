import { pipeline } from '@xenova/transformers';

/**
 * CategoryClassificationService
 * 
 * Provides client-side product category classification using a trained Support Vector Classifier
 * backed by Xenova/all-MiniLM-L6-v2 embeddings. The SVC model is loaded from /models/svc_model.json
 * and is required for the app to function. The model is cached by the service worker for offline use.
 */

// Category definitions (used only as a fallback for getCategories before SVC loads)
const CATEGORY_DEFINITIONS = {
  'Fruits & vegetables': [
    'fruit',
    'vegetables'
  ],
  'Meat & seafood': [
    'meat',
    'seafood',
    'tofu',
    'meat alternatives'
  ],
  'Bakery & bread': [
    'bread',
    'breading & crumbs',
    'cookies',
    'dessert',
    'pastries',
    'tortillas',
    'cakes'
  ],
  'Dairy & eggs': [
    'biscuit dough',
    'cookie dough',
    'butter',
    'margarine',
    'cheese',
    'cottage cheese',
    'cream',
    'eggs',
    'egg substitute',
    'milk',
    'pudding',
    'gelatine',
    'sour cream',
    'yogurt'
  ],
  'Deli & prepared food': [
    'dip',
    'deli cheese',
    'deli meat',
    'ready meals',
    'ready snacks'
  ],
  'Pantry': [
    'baking ingredients',
    'broth',
    'bouillon',
    'canned food',
    'dried food',
    'cereal',
    'breakfast',
    'condiments',
    'dressing',
    'oil',
    'vinegar',
    'jelly',
    'jam',
    'pantry meals',
    'pasta',
    'rice',
    'peanut butter',
    'salsa',
    'sauces',
    'marinades',
    'snacks',
    'candy',
    'soups',
    'chili',
    'spices',
    'seasonings',
    'sugar',
    'sweeteners'
  ],
  'Frozen food': [
    'frozen bread',
    'frozen baked goods',
    'frozen fruit',
    'ice cream',
    'frozen treats',
    'frozen juice',
    'frozen smoothies',
    'frozen meals',
    'frozen sides',
    'frozen meat',
    'frozen meat alternatives',
    'frozen seafood',
    'frozen vegetables'
  ],
  'Beverages': [
    'beer',
    'wine',
    'cocoa',
    'coconut water',
    'coffee',
    'coffee creamer',
    'coffee filters',
    'ice',
    'juice',
    'beverage mixes',
    'beverage flavor enhancers',
    'shakes',
    'smoothies',
    'soda',
    'sports drinks',
    'energy drinks',
    'tea',
    'water'
  ],
  'Everyday essentials': [
    'air fresheners',
    'candles',
    'batteries',
    'cleaners',
    'cleaning tools',
    'disposable kitchenware',
    'facial tissue',
    'food storage',
    'food wraps',
    'laundry',
    'paper towels',
    'toilet paper',
    'trash bags'
  ],
  'Health & beauty': [
    'bath & skin care',
    'hair care',
    'makeup',
    'nails',
    'cotton balls',
    'cotton swabs',
    'diet & fitness',
    'eye care',
    'ear care',
    'feminine care',
    'foot care',
    'home health care',
    'incontinence',
    'medicines',
    'treatments',
    'oral hygiene',
    'sexual wellness',
    'vitamins',
    'supplements'
  ],
  'Home & outdoor': [
    'bedding',
    'clothes',
    'shoes',
    'seasonal decor',
    'electronics',
    'home improvement',
    'kitchen & dining',
    'patio & outdoor',
    'pest control',
    'school supplies',
    'office supplies',
    'storage',
    'organization',
    'flowers',
    'gift baskets'
  ],
  'Baby & kids': [
    'baby food',
    'baby formula',
    'diapers',
    'potty',
    'baby health',
    'baby skin care',
    'toys',
    'baby feeding',
    'baby bath tubs & accessories',
    'nursery & kids room',
    'baby clothing',
    'kids clothing',
    'baby travel equipment'
  ],
  'Pets': [
    'dogs',
    'cats',
    'birds',
    'fish',
    'small animals',
    'reptiles'
  ]
};

// Default category when no match is found
const DEFAULT_CATEGORY = 'Other';

class CategoryClassificationService {
  constructor() {
    this.embedder = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.initializationPromise = null;
    // SVC model data (loaded from JSON)
    this.svcModel = null;
  }

  /**
   * Initialize the embedding model and load the SVC classifier.
   * Both are required -- initialization fails if either is unavailable.
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[CategoryClassification] Model already initialized');
      return true;
    }

    if (this.isInitializing) {
      console.log('[CategoryClassification] Initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    this.isInitializing = true;
    console.log('[CategoryClassification] Starting model initialization...');
    
    this.initializationPromise = (async () => {
      try {
        const startTime = performance.now();
        
        // Initialize the embedding pipeline
        this.embedder = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2'
        );
        
        const modelLoadTime = performance.now();
        console.log(`[CategoryClassification] Embedding model loaded in ${(modelLoadTime - startTime).toFixed(0)}ms`);
        
        // Load SVC model (required)
        await this._loadSvcModel();
        
        const endTime = performance.now();
        this.isInitialized = true;
        console.log(`[CategoryClassification] Initialization complete in ${(endTime - startTime).toFixed(0)}ms [SVC: ${this.svcModel.nClasses} classes]`);
        return true;
      } catch (error) {
        console.error('[CategoryClassification] Failed to initialize:', error);
        this.isInitialized = false;
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Load the SVC model from the public models directory.
   * Throws if the model cannot be loaded -- SVC is required for classification.
   */
  async _loadSvcModel() {
    const response = await fetch('/models/svc_model.json');
    if (!response.ok) {
      throw new Error(`Failed to load SVC model: HTTP ${response.status}`);
    }
    const data = await response.json();
    
    if (!data.weights || !data.bias || !data.classes) {
      throw new Error('Invalid SVC model: missing weights, bias, or classes');
    }

    this.svcModel = {
      weights: data.weights,
      bias: data.bias,
      classes: data.classes,
      nClasses: data.n_classes,
      nFeatures: data.n_features,
    };
    console.log(`[CategoryClassification] SVC model loaded (${data.n_classes} classes, accuracy: ${(data.accuracy?.test * 100).toFixed(1)}%)`);
  }

  /**
   * Generate an embedding vector for a text string.
   * Returns a normalized 384-dimensional vector.
   */
  async _getEmbedding(text) {
    if (!this.embedder) {
      throw new Error('Category classification model not initialized. Call initialize() first.');
    }

    try {
      const output = await this.embedder(text, { 
        pooling: 'mean', 
        normalize: true 
      });
      return Array.from(output.data);
    } catch (error) {
      console.error('[CategoryClassification] Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Classify a product name into a category.
   * Uses the trained SVC model: scores = embedding * weights^T + bias, then argmax.
   * 
   * @param {string} productName - The name of the product to classify
   * @returns {Promise<string>} - The category name (e.g., "Fruits & vegetables")
   */
  async classifyProduct(productName) {
    if (!this.isInitialized) {
      console.log('[CategoryClassification] Not initialized, returning default category');
      return DEFAULT_CATEGORY;
    }

    if (!productName || productName.trim() === '') {
      return DEFAULT_CATEGORY;
    }

    try {
      const startTime = performance.now();
      const productEmbedding = await this._getEmbedding(productName);
      const { weights, bias, classes, nClasses } = this.svcModel;
      
      let bestScore = -Infinity;
      let bestClass = DEFAULT_CATEGORY;
      
      for (let c = 0; c < nClasses; c++) {
        let score = bias[c];
        for (let f = 0; f < productEmbedding.length; f++) {
          score += productEmbedding[f] * weights[c][f];
        }
        if (score > bestScore) {
          bestScore = score;
          bestClass = classes[c];
        }
      }

      const endTime = performance.now();
      console.log(`[CategoryClassification] "${productName}" -> "${bestClass}" (score ${bestScore.toFixed(4)}) [${(endTime - startTime).toFixed(0)}ms]`);
      return bestClass;
    } catch (error) {
      console.error('[CategoryClassification] Error classifying product:', error);
      return DEFAULT_CATEGORY;
    }
  }

  /**
   * Generate an embedding for a product name.
   * Useful for product-to-product similarity comparisons.
   * 
   * @param {string} productName - The name of the product
   * @returns {Promise<number[]>} - The 384-dimensional embedding vector
   */
  async getEmbedding(productName) {
    if (!this.isInitialized) {
      throw new Error('Category classification model not initialized. Call initialize() first.');
    }
    return this._getEmbedding(productName);
  }

  /**
   * Get all available categories from the SVC model.
   * @returns {string[]} - Array of category names
   */
  getCategories() {
    if (this.svcModel) {
      return [...this.svcModel.classes, DEFAULT_CATEGORY];
    }
    return [...Object.keys(CATEGORY_DEFINITIONS), DEFAULT_CATEGORY];
  }

  /**
   * Get initialization status.
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      svcClasses: this.svcModel?.nClasses || 0
    };
  }
}

// Create singleton instance
const categoryClassificationService = new CategoryClassificationService();

export default categoryClassificationService;
