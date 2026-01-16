import { pipeline } from '@xenova/transformers';

/**
 * CategoryClassificationService
 * 
 * Provides client-side product category classification using the awidjaja/zero-shot-xlmR-food model.
 * This enables automatic categorization of products based on their names using semantic similarity.
 * 
 * The service uses zero-shot classification by comparing product name embeddings against
 * pre-computed subcategory embeddings and selecting the best matching category.
 */

// Category definitions with their subcategories
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
    // Pre-computed subcategory embeddings for fast classification
    this.subcategoryEmbeddings = null;
  }

  /**
   * Initialize the classification model and pre-compute subcategory embeddings
   * This downloads and loads the model (~23MB, cached by browser)
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
          'awidjaja/zero-shot-xlmR-food'
        );
        
        const modelLoadTime = performance.now();
        console.log(`[CategoryClassification] Model loaded in ${(modelLoadTime - startTime).toFixed(0)}ms`);
        
        // Pre-compute embeddings for all subcategories
        await this._precomputeSubcategoryEmbeddings();
        
        const endTime = performance.now();
        this.isInitialized = true;
        console.log(`[CategoryClassification] Initialization complete in ${(endTime - startTime).toFixed(0)}ms`);
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
      
      // Find the most similar subcategory
      let bestMatch = {
        category: DEFAULT_CATEGORY,
        subcategory: null,
        similarity: -1
      };

      for (const { category, subcategory, embedding } of this.subcategoryEmbeddings) {
        const similarity = this._cosineSimilarity(productEmbedding, embedding);
        
        if (similarity > bestMatch.similarity) {
          bestMatch = {
            category,
            subcategory,
            similarity
          };
        }
      }

      const endTime = performance.now();
      
      // If similarity is below threshold, return default category
      if (bestMatch.similarity < CLASSIFICATION_THRESHOLD) {
        console.log(`[CategoryClassification] "${productName}" -> "${DEFAULT_CATEGORY}" (best match "${bestMatch.subcategory}" with score ${bestMatch.similarity.toFixed(4)} below threshold) [${(endTime - startTime).toFixed(0)}ms]`);
        return DEFAULT_CATEGORY;
      }

      console.log(`[CategoryClassification] "${productName}" -> "${bestMatch.category}" (matched "${bestMatch.subcategory}" with score ${bestMatch.similarity.toFixed(4)}) [${(endTime - startTime).toFixed(0)}ms]`);
      return bestMatch.category;
    } catch (error) {
      console.error('[CategoryClassification] Error classifying product:', error);
      return DEFAULT_CATEGORY;
    }
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
      subcategoryCount: this.subcategoryEmbeddings?.length || 0
    };
  }
}

// Create singleton instance
const categoryClassificationService = new CategoryClassificationService();

export default categoryClassificationService;
