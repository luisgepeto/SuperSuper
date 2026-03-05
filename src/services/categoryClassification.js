import { pipeline } from '@xenova/transformers';

/**
 * CategoryClassificationService
 * 
 * Provides client-side product category classification using the Xenova/all-MiniLM-L6-v2 model.
 * 
 * Two classification modes:
 * 1. SVC mode (preferred): Uses a trained Support Vector Classifier with learned weights
 *    from real supermarket data. The SVC model is loaded from /models/svc_model.json.
 * 2. Fallback mode: Zero-shot cosine similarity against subcategory embeddings.
 *    Used when the SVC model fails to load.
 */

// Category definitions with their subcategories (used as fallback)
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

// Minimum similarity threshold for classification
const CLASSIFICATION_THRESHOLD = 0.25;

class CategoryClassificationService {
  constructor() {
    this.embedder = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.initializationPromise = null;
    // Pre-computed subcategory embeddings for fallback classification
    this.subcategoryEmbeddings = null;
    // SVC model data (loaded from JSON)
    this.svcModel = null;
    this.useSvc = false;
  }

  /**
   * Initialize the classification model, SVC weights, and pre-compute subcategory embeddings.
   * Downloads and loads the embedding model (~23MB, cached by browser).
   * Also loads the SVC model (~100KB) for improved classification.
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
        console.log(`[CategoryClassification] Model loaded in ${(modelLoadTime - startTime).toFixed(0)}ms`);
        
        // Try to load SVC model (preferred classification method)
        await this._loadSvcModel();
        
        // Only pre-compute subcategory embeddings if SVC failed to load
        if (!this.useSvc) {
          console.log('[CategoryClassification] SVC unavailable, falling back to cosine similarity');
          await this._precomputeSubcategoryEmbeddings();
        }
        
        const endTime = performance.now();
        this.isInitialized = true;
        const mode = this.useSvc ? 'SVC' : 'cosine similarity (fallback)';
        console.log(`[CategoryClassification] Initialization complete in ${(endTime - startTime).toFixed(0)}ms [mode: ${mode}]`);
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
   * Falls back to cosine similarity if the model can't be loaded.
   */
  async _loadSvcModel() {
    try {
      const response = await fetch('/models/svc_model.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      
      this.svcModel = {
        weights: data.weights,
        bias: data.bias,
        classes: data.classes,
        nClasses: data.n_classes,
        nFeatures: data.n_features,
      };
      this.useSvc = true;
      console.log(`[CategoryClassification] SVC model loaded (${data.n_classes} classes, accuracy: ${(data.accuracy?.test * 100).toFixed(1)}%)`);
    } catch (error) {
      console.warn('[CategoryClassification] SVC model not available, using cosine similarity fallback:', error.message);
      this.useSvc = false;
    }
  }

  /**
   * Pre-compute embeddings for all subcategories
   * This enables fast classification by avoiding embedding computation at classification time
   */
  async _precomputeSubcategoryEmbeddings() {
    console.log('[CategoryClassification] Pre-computing subcategory embeddings...');
    
    this.subcategoryEmbeddings = [];
    
    for (const [category, subcategories] of Object.entries(CATEGORY_DEFINITIONS)) {
      for (const subcategory of subcategories) {
        const embedding = await this._getEmbedding(subcategory);
        this.subcategoryEmbeddings.push({
          category,
          subcategory,
          embedding
        });
      }
    }
    
    console.log(`[CategoryClassification] Pre-computed ${this.subcategoryEmbeddings.length} subcategory embeddings`);
  }

  /**
   * Generate an embedding vector for a text string
   * Returns a normalized 384-dimensional vector
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
   * Calculate cosine similarity between two vectors
   * Returns a value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   * For normalized vectors, this is just the dot product
   */
  _cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
    }

    return dotProduct;
  }

  /**
   * Classify a product name into a category
   * Uses SVC when available, falls back to cosine similarity
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
      
      // Generate embedding for the product name
      const productEmbedding = await this._getEmbedding(productName);
      
      let result;
      if (this.useSvc && this.svcModel) {
        result = this._classifySvc(productName, productEmbedding, startTime);
      } else {
        result = this._classifyCosine(productName, productEmbedding, startTime);
      }

      return result;
    } catch (error) {
      console.error('[CategoryClassification] Error classifying product:', error);
      return DEFAULT_CATEGORY;
    }
  }

  /**
   * Classify using SVC (preferred method)
   * Computes: scores = embedding * weights^T + bias, then argmax
   */
  _classifySvc(productName, embedding, startTime) {
    const { weights, bias, classes, nClasses } = this.svcModel;
    
    // Compute decision scores: dot product of embedding with each class weight vector + bias
    let bestScore = -Infinity;
    let bestClass = DEFAULT_CATEGORY;
    
    for (let c = 0; c < nClasses; c++) {
      let score = bias[c];
      for (let f = 0; f < embedding.length; f++) {
        score += embedding[f] * weights[c][f];
      }
      if (score > bestScore) {
        bestScore = score;
        bestClass = classes[c];
      }
    }

    const endTime = performance.now();
    console.log(`[CategoryClassification] "${productName}" -> "${bestClass}" (SVC score ${bestScore.toFixed(4)}) [${(endTime - startTime).toFixed(0)}ms]`);
    return bestClass;
  }

  /**
   * Classify using cosine similarity (fallback method)
   */
  _classifyCosine(productName, embedding, startTime) {
    let bestMatch = {
      category: DEFAULT_CATEGORY,
      subcategory: null,
      similarity: -1
    };

    for (const { category, subcategory, embedding: subEmbedding } of this.subcategoryEmbeddings) {
      const similarity = this._cosineSimilarity(embedding, subEmbedding);
      
      if (similarity > bestMatch.similarity) {
        bestMatch = { category, subcategory, similarity };
      }
    }

    const endTime = performance.now();
    
    if (bestMatch.similarity < CLASSIFICATION_THRESHOLD) {
      console.log(`[CategoryClassification] "${productName}" -> "${DEFAULT_CATEGORY}" (best match "${bestMatch.subcategory}" with score ${bestMatch.similarity.toFixed(4)} below threshold) [${(endTime - startTime).toFixed(0)}ms]`);
      return DEFAULT_CATEGORY;
    }

    console.log(`[CategoryClassification] "${productName}" -> "${bestMatch.category}" (matched "${bestMatch.subcategory}" with score ${bestMatch.similarity.toFixed(4)}) [${(endTime - startTime).toFixed(0)}ms]`);
    return bestMatch.category;
  }

  /**
   * Generate a weighted embedding for a product name.
   * Useful for product-to-product similarity comparisons.
   * Returns the raw 384-dim embedding (SVC weights can be applied externally for similarity).
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
   * Get all available categories
   * @returns {string[]} - Array of category names
   */
  getCategories() {
    return [...Object.keys(CATEGORY_DEFINITIONS), DEFAULT_CATEGORY];
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      useSvc: this.useSvc,
      subcategoryCount: this.subcategoryEmbeddings?.length || 0,
      svcClasses: this.svcModel?.nClasses || 0
    };
  }
}

// Create singleton instance
const categoryClassificationService = new CategoryClassificationService();

export default categoryClassificationService;
