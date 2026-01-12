// Pantry storage service using localStorage for frontend-only persistence
// Manages the user's pantry items that track food at home
//
// Storage Schema (optimized for O(1) search by productId and fast partial name search):
// {
//   "items": {
//     "productId1": { productId, productName, productNameLower, quantity, image },
//     "productId2": { productId, productName, productNameLower, quantity, image },
//     ...
//   },
//   "nameIndex": {
//     "product name lower 1": ["productId1"],
//     "product name lower 2": ["productId2", "productId3"],  // multiple items can have same name
//     ...
//   },
//   "wordIndex": {
//     "word1": ["productId1", "productId2"],  // all products containing this word
//     "word2": ["productId1"],
//     ...
//   }
// }
//
// - items: Object with productId as key enables O(1) lookup by barcode/productId
// - nameIndex: Object with lowercase productName as key, value is array of productIds
//   This handles name collisions (multiple products can have the same name)
// - wordIndex: Object mapping each word (from product names) to array of productIds
//   Enables fast partial word search by checking if search term is prefix of indexed words
// - productNameLower field on items enables efficient case-insensitive partial name search
//
const PANTRY_STORAGE_KEY = 'supersuper_pantry';

class PantryStorage {
  // Get raw pantry data (for internal use)
  _getPantryData() {
    try {
      const stored = localStorage.getItem(PANTRY_STORAGE_KEY);
      if (!stored) {
        return { items: {}, nameIndex: {}, wordIndex: {} };
      }
      const data = JSON.parse(stored);
      // Ensure wordIndex exists (for backward compatibility during transition)
      if (!data.wordIndex) {
        data.wordIndex = {};
      }
      return data;
    } catch (error) {
      console.error('Error reading pantry from localStorage:', error);
      return { items: {}, nameIndex: {}, wordIndex: {} };
    }
  }

  // Save pantry data
  _savePantryData(data) {
    try {
      localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving pantry to localStorage:', error);
    }
  }

  // Extract words from product name for word index
  _extractWords(productName) {
    // Split by non-alphanumeric characters and filter empty strings
    return productName
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(word => word.length > 0);
  }

  // Add productId to nameIndex
  _addToNameIndex(data, nameLower, productId) {
    if (!data.nameIndex[nameLower]) {
      data.nameIndex[nameLower] = [];
    }
    if (!data.nameIndex[nameLower].includes(productId)) {
      data.nameIndex[nameLower].push(productId);
    }
  }

  // Remove productId from nameIndex
  _removeFromNameIndex(data, nameLower, productId) {
    if (data.nameIndex[nameLower]) {
      data.nameIndex[nameLower] = data.nameIndex[nameLower].filter(id => id !== productId);
      // Clean up empty arrays
      if (data.nameIndex[nameLower].length === 0) {
        delete data.nameIndex[nameLower];
      }
    }
  }

  // Add productId to wordIndex for each word in the product name
  _addToWordIndex(data, productName, productId) {
    const words = this._extractWords(productName);
    words.forEach(word => {
      if (!data.wordIndex[word]) {
        data.wordIndex[word] = [];
      }
      if (!data.wordIndex[word].includes(productId)) {
        data.wordIndex[word].push(productId);
      }
    });
  }

  // Remove productId from wordIndex for each word in the product name
  _removeFromWordIndex(data, productName, productId) {
    const words = this._extractWords(productName);
    words.forEach(word => {
      if (data.wordIndex[word]) {
        data.wordIndex[word] = data.wordIndex[word].filter(id => id !== productId);
        // Clean up empty arrays
        if (data.wordIndex[word].length === 0) {
          delete data.wordIndex[word];
        }
      }
    });
  }

  // Get all pantry items as array (for UI rendering)
  getAllItems() {
    const data = this._getPantryData();
    return Object.values(data.items);
  }

  // Get item by productId - O(1) lookup
  getItemById(productId) {
    const data = this._getPantryData();
    return data.items[productId] || null;
  }

  // Get items by exact productName - O(1) lookup, returns array (multiple items can have same name)
  getItemsByName(productName) {
    const data = this._getPantryData();
    const nameLower = productName.toLowerCase();
    const productIds = data.nameIndex[nameLower] || [];
    return productIds.map(id => data.items[id]).filter(Boolean);
  }

  /**
   * Search pantry items by partial name match
   * 
   * SEARCH ALGORITHM EXPLANATION:
   * =============================
   * 
   * When user types a search query (e.g., "mil" to find "Milk" or "Almond Milk"):
   * 
   * 1. WORD-BASED INDEX SEARCH (O(k) where k = number of indexed words):
   *    - Split the search query into words (e.g., "alm mil" -> ["alm", "mil"])
   *    - For each search word, find all indexed words that CONTAIN it
   *      Example: "mil" matches "milk", "amilk", etc.
   *    - Collect all productIds from matching word entries
   *    - If multiple search words, find intersection (products matching ALL words)
   * 
   * 2. RESULT RETRIEVAL (O(m) where m = number of matched products):
   *    - Look up each matched productId in items object (O(1) per item)
   *    - Return array of matching items
   * 
   * PERFORMANCE:
   * - Much faster than iterating all items for partial matches
   * - Word index enables substring matching without full string scanning
   * - Empty search returns all items immediately
   * 
   * @param {string} searchQuery - The search term entered by user
   * @returns {Array} - Array of matching pantry items
   */
  searchByName(searchQuery) {
    const data = this._getPantryData();
    
    // Step 1: If search query is empty, return all items immediately
    // This handles the case when search bar is cleared
    if (!searchQuery || searchQuery.trim() === '') {
      return Object.values(data.items);
    }

    // Step 2: Extract search words from query (lowercase, split by non-alphanumeric)
    const searchWords = this._extractWords(searchQuery);
    
    // Step 3: If no valid search words, return all items
    if (searchWords.length === 0) {
      return Object.values(data.items);
    }

    // Step 4: For each search word, find all productIds where any word in the
    // product name CONTAINS the search word (substring matching)
    let matchedProductIds = null;

    for (const searchWord of searchWords) {
      const productIdsForThisWord = new Set();
      
      // Step 4a: Iterate through wordIndex to find words that contain searchWord
      // This is O(k) where k = number of unique words in index
      for (const [indexedWord, productIds] of Object.entries(data.wordIndex)) {
        // Check if the indexed word contains the search word (substring match)
        // This enables flexible partial matching (e.g., "lk" matches "milk")
        if (indexedWord.includes(searchWord)) {
          // Add all productIds that have this word
          productIds.forEach(id => productIdsForThisWord.add(id));
        }
      }

      // Step 4b: If this is the first search word, initialize the result set
      // Otherwise, intersect with previous results (product must match ALL words)
      if (matchedProductIds === null) {
        matchedProductIds = productIdsForThisWord;
      } else {
        // Intersection: keep only productIds that exist in both sets
        matchedProductIds = new Set(
          [...matchedProductIds].filter(id => productIdsForThisWord.has(id))
        );
      }

      // Step 4c: Early exit if no matches found
      if (matchedProductIds.size === 0) {
        return [];
      }
    }

    // Step 5: Retrieve full item objects for matched productIds
    // O(1) lookup per item from items object
    const results = [];
    for (const productId of matchedProductIds) {
      const item = data.items[productId];
      if (item) {
        results.push(item);
      }
    }

    return results;
  }

  // Add or update items from a completed shopping trip
  // If item exists (by productId), increase quantity; otherwise add new item
  addItemsFromTrip(tripItems) {
    const data = this._getPantryData();
    
    tripItems.forEach((tripItem) => {
      // Use barcode as the product identifier
      const productId = tripItem.barcode;
      if (!productId) {
        console.warn('Skipping trip item without barcode:', tripItem);
        return;
      }

      const productName = tripItem.productName || productId;
      const productNameLower = productName.toLowerCase();

      if (data.items[productId]) {
        // Item exists, increase quantity and update image if available
        const oldNameLower = data.items[productId].productNameLower;
        const oldProductName = data.items[productId].productName;
        data.items[productId].quantity += tripItem.quantity || 1;
        // Update image if we have one and the pantry item doesn't
        if ((tripItem.image || tripItem.thumbnail) && !data.items[productId].image) {
          data.items[productId].image = tripItem.image || tripItem.thumbnail;
        }
        // Update name index and word index if name changed
        if (oldNameLower !== productNameLower) {
          this._removeFromNameIndex(data, oldNameLower, productId);
          this._removeFromWordIndex(data, oldProductName, productId);
          this._addToNameIndex(data, productNameLower, productId);
          this._addToWordIndex(data, productName, productId);
          data.items[productId].productName = productName;
          data.items[productId].productNameLower = productNameLower;
        }
      } else {
        // New item, add to pantry with image
        data.items[productId] = {
          productId: productId,
          productName: productName,
          productNameLower: productNameLower,
          quantity: tripItem.quantity || 1,
          image: tripItem.image || tripItem.thumbnail || null
        };
        // Add to name index and word index
        this._addToNameIndex(data, productNameLower, productId);
        this._addToWordIndex(data, productName, productId);
      }
    });

    this._savePantryData(data);
    return Object.values(data.items);
  }

  // Update a pantry item (name, quantity, image)
  updateItem(productId, updates) {
    const data = this._getPantryData();
    
    if (data.items[productId]) {
      const oldNameLower = data.items[productId].productNameLower;
      const oldProductName = data.items[productId].productName;
      
      data.items[productId] = {
        ...data.items[productId],
        ...updates
      };
      
      // Update name index and word index if productName was updated
      if (updates.productName) {
        const newNameLower = updates.productName.toLowerCase();
        data.items[productId].productNameLower = newNameLower;
        // Update indices
        if (oldNameLower !== newNameLower) {
          this._removeFromNameIndex(data, oldNameLower, productId);
          this._removeFromWordIndex(data, oldProductName, productId);
          this._addToNameIndex(data, newNameLower, productId);
          this._addToWordIndex(data, updates.productName, productId);
          
          // Update semantic search embedding if the name changed
          this._updateSemanticEmbedding(productId, updates.productName);
        }
      }
      this._savePantryData(data);
    }
    return Object.values(data.items);
  }

  // Update semantic search embedding for an item (if semantic search is available)
  async _updateSemanticEmbedding(productId, productName) {
    try {
      // Dynamically import semantic search service only if available
      const semanticSearchModule = await import('./semanticSearch');
      const semanticSearchService = semanticSearchModule.default;
      
      // Only update embedding if the service is initialized
      if (semanticSearchService && semanticSearchService.isInitialized) {
        await semanticSearchService.updateItemEmbedding(productId, productName);
      }
    } catch (error) {
      // Silently fail if semantic search is not available or not loaded
      // This is expected behavior when semantic search feature is disabled
    }
  }

  // Update quantity of a specific item
  updateItemQuantity(productId, newQuantity) {
    const data = this._getPantryData();
    
    if (data.items[productId]) {
      if (newQuantity <= 0) {
        // Remove item if quantity is 0 or less
        const nameLower = data.items[productId].productNameLower;
        const productName = data.items[productId].productName;
        this._removeFromNameIndex(data, nameLower, productId);
        this._removeFromWordIndex(data, productName, productId);
        delete data.items[productId];
      } else {
        data.items[productId].quantity = newQuantity;
      }
      this._savePantryData(data);
    }
    return Object.values(data.items);
  }

  // Remove an item from the pantry - O(1) operation
  removeItem(productId) {
    const data = this._getPantryData();
    if (data.items[productId]) {
      const nameLower = data.items[productId].productNameLower;
      const productName = data.items[productId].productName;
      this._removeFromNameIndex(data, nameLower, productId);
      this._removeFromWordIndex(data, productName, productId);
      delete data.items[productId];
      this._savePantryData(data);
    }
    return Object.values(data.items);
  }

  // Clear all pantry items
  clearPantry() {
    try {
      localStorage.removeItem(PANTRY_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing pantry:', error);
      return false;
    }
  }
}

// Create singleton instance
const pantryStorage = new PantryStorage();

export default pantryStorage;
