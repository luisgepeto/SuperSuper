import { pipeline } from '@xenova/transformers';

/**
 * SemanticSearchService
 * 
 * Provides client-side semantic search using the Xenova/all-MiniLM-L6-v2 model.
 * This enables searching pantry items by meaning rather than exact text matching.
 * 
 * Example: searching for "pasta" will match "spaghetti", "penne", etc.
 * 
 * The model runs entirely in the browser using WebAssembly and is cached after first download (~23MB).
 */

// Default configuration constants
const DEFAULT_SIMILARITY_THRESHOLD = 0.3;
const DEFAULT_MAX_RESULTS = 10;

class SemanticSearchService {
  constructor() {
    this.embedder = null;
    this.itemEmbeddings = new Map();
    this.isInitialized = false;
    this.isInitializing = false;
    this.initializationPromise = null;
  }

  /**
   * Initialize the semantic search model
   * This downloads and loads the model (~23MB, cached by browser)
   * First load takes ~2-5 seconds, subsequent loads are much faster
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[SemanticSearch] Model already initialized');
      return true;
    }

    if (this.isInitializing) {
      console.log('[SemanticSearch] Initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    this.isInitializing = true;
    console.log('[SemanticSearch] Starting model initialization...');
    console.log('[SemanticSearch] Model: Xenova/all-MiniLM-L6-v2 (~23MB, will be cached)');
    this.initializationPromise = (async () => {
      try {
        const startTime = performance.now();
        this.embedder = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2'
        );
        const endTime = performance.now();
        this.isInitialized = true;
        console.log(`[SemanticSearch] Model initialized successfully in ${(endTime - startTime).toFixed(0)}ms`);
        return true;
      } catch (error) {
        console.error('[SemanticSearch] Failed to initialize model:', error);
        this.isInitialized = false;
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Generate an embedding vector for a text string
   * Returns a normalized 384-dimensional vector
   */
  async getEmbedding(text) {
    if (!this.isInitialized) {
      throw new Error('Semantic search model not initialized');
    }

    try {
      const output = await this.embedder(text, { 
        pooling: 'mean', 
        normalize: true 
      });
      return Array.from(output.data);
    } catch (error) {
      console.error('[SemanticSearch] Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns a value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   * For normalized vectors, this is just the dot product
   */
  cosineSimilarity(vecA, vecB) {
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
   * Cache embedding for a pantry item
   * This improves performance by avoiding re-computation
   */
  async indexItem(productId, productName) {
    if (!this.isInitialized) {
      return;
    }

    try {
      const embedding = await this.getEmbedding(productName);
      this.itemEmbeddings.set(productId, {
        productName,
        embedding
      });
    } catch (error) {
      console.error(`[SemanticSearch] Error indexing item ${productId}:`, error);
    }
  }

  /**
   * Remove an item from the embedding cache
   */
  removeItem(productId) {
    this.itemEmbeddings.delete(productId);
  }

  /**
   * Clear all cached embeddings
   */
  clearCache() {
    this.itemEmbeddings.clear();
  }

  /**
   * Perform KNN (K-Nearest Neighbors) semantic search
   * 
   * @param {string} query - The search query
   * @param {Array} pantryItems - Array of pantry items to search
   * @param {number} k - Maximum number of results to return (default: DEFAULT_MAX_RESULTS)
   * @param {number} similarityThreshold - Minimum similarity score (default: DEFAULT_SIMILARITY_THRESHOLD = 0.3)
   * @returns {Array} - Array of items sorted by semantic similarity
   */
  async searchKNN(query, pantryItems, k = DEFAULT_MAX_RESULTS, similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD) {
    if (!this.isInitialized) {
      throw new Error('Semantic search model not initialized');
    }

    if (!query || query.trim() === '') {
      console.log('[SemanticSearch] Empty query, returning all items');
      return pantryItems;
    }

    try {
      console.log('[SemanticSearch] ========== Starting Semantic Search ==========');
      console.log('[SemanticSearch] Query:', query);
      console.log('[SemanticSearch] Total items to search:', pantryItems.length);
      console.log('[SemanticSearch] Max results (k):', k);
      console.log('[SemanticSearch] Similarity threshold:', similarityThreshold);
      
      const searchStartTime = performance.now();
      const queryEmbedding = await this.getEmbedding(query);
      const embeddingTime = performance.now();
      console.log(`[SemanticSearch] Query embedding generated in ${(embeddingTime - searchStartTime).toFixed(0)}ms`);
      
      const results = [];
      let cachedCount = 0;
      let computedCount = 0;

      for (const item of pantryItems) {
        let itemEmbedding;
        
        const cached = this.itemEmbeddings.get(item.productId);
        if (cached && cached.productName === item.productName) {
          itemEmbedding = cached.embedding;
          cachedCount++;
        } else {
          itemEmbedding = await this.getEmbedding(item.productName);
          this.itemEmbeddings.set(item.productId, {
            productName: item.productName,
            embedding: itemEmbedding
          });
          computedCount++;
        }

        const similarity = this.cosineSimilarity(queryEmbedding, itemEmbedding);

        if (similarity >= similarityThreshold) {
          results.push({
            item,
            similarity
          });
        }
      }

      console.log(`[SemanticSearch] Item embeddings: ${cachedCount} from cache, ${computedCount} computed`);
      console.log(`[SemanticSearch] Items above threshold (${similarityThreshold}):`, results.length);

      results.sort((a, b) => b.similarity - a.similarity);

      const topK = k > 0 ? results.slice(0, k) : results;

      console.log(`[SemanticSearch] Top ${topK.length} results by similarity:`);
      topK.forEach((result, index) => {
        console.log(`[SemanticSearch]   ${index + 1}. "${result.item.productName}" (score: ${result.similarity.toFixed(4)})`);
      });

      const searchEndTime = performance.now();
      console.log(`[SemanticSearch] Total search time: ${(searchEndTime - searchStartTime).toFixed(0)}ms`);
      console.log('[SemanticSearch] ========== Search Complete ==========');

      return topK.map(result => result.item);
    } catch (error) {
      console.error('[SemanticSearch] Error performing semantic search:', error);
      throw error;
    }
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      cachedItemsCount: this.itemEmbeddings.size
    };
  }
}

const semanticSearchService = new SemanticSearchService();

export default semanticSearchService;
