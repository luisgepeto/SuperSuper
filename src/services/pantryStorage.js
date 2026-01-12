// Pantry storage service using localStorage for frontend-only persistence
// Manages the user's pantry items that track food at home
//
// Storage Schema (optimized for search by productId and productName):
// {
//   "productId1": { productId, productName, productNameLower, quantity, image },
//   "productId2": { productId, productName, productNameLower, quantity, image },
//   ...
// }
//
// - Object with productId as key enables O(1) lookup by barcode/productId
// - productNameLower field enables efficient case-insensitive name search
// - getAllItems() returns array for UI rendering compatibility
//
const PANTRY_STORAGE_KEY = 'supersuper_pantry';

class PantryStorage {
  // Get raw pantry data as object (for internal use and efficient lookups)
  _getPantryMap() {
    try {
      const stored = localStorage.getItem(PANTRY_STORAGE_KEY);
      if (!stored) {
        return {};
      }
      const parsed = JSON.parse(stored);
      // Handle migration from old array format to new object format
      if (Array.isArray(parsed)) {
        const migrated = this._migrateFromArray(parsed);
        this._savePantryMap(migrated);
        return migrated;
      }
      return parsed;
    } catch (error) {
      console.error('Error reading pantry from localStorage:', error);
      return {};
    }
  }

  // Save pantry data as object
  _savePantryMap(pantryMap) {
    try {
      localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(pantryMap));
    } catch (error) {
      console.error('Error saving pantry to localStorage:', error);
    }
  }

  // Migrate from old array format to new object format
  _migrateFromArray(arrayData) {
    const pantryMap = {};
    arrayData.forEach((item) => {
      if (item.productId) {
        pantryMap[item.productId] = {
          ...item,
          productNameLower: (item.productName || item.productId || '').toLowerCase()
        };
      }
    });
    return pantryMap;
  }

  // Get all pantry items as array (for UI rendering)
  getAllItems() {
    const pantryMap = this._getPantryMap();
    return Object.values(pantryMap);
  }

  // Get item by productId - O(1) lookup
  getItemById(productId) {
    const pantryMap = this._getPantryMap();
    return pantryMap[productId] || null;
  }

  // Add or update items from a completed shopping trip
  // If item exists (by productId), increase quantity; otherwise add new item
  addItemsFromTrip(tripItems) {
    const pantryMap = this._getPantryMap();
    
    tripItems.forEach((tripItem) => {
      // Use barcode as the product identifier
      const productId = tripItem.barcode;
      if (!productId) {
        console.warn('Skipping trip item without barcode:', tripItem);
        return;
      }

      const productName = tripItem.productName || productId;

      if (pantryMap[productId]) {
        // Item exists, increase quantity and update image if available
        pantryMap[productId].quantity += tripItem.quantity || 1;
        // Update image if we have one and the pantry item doesn't
        if ((tripItem.image || tripItem.thumbnail) && !pantryMap[productId].image) {
          pantryMap[productId].image = tripItem.image || tripItem.thumbnail;
        }
      } else {
        // New item, add to pantry with image
        pantryMap[productId] = {
          productId: productId,
          productName: productName,
          productNameLower: productName.toLowerCase(),
          quantity: tripItem.quantity || 1,
          image: tripItem.image || tripItem.thumbnail || null
        };
      }
    });

    this._savePantryMap(pantryMap);
    return Object.values(pantryMap);
  }

  // Update a pantry item (name, quantity, image)
  updateItem(productId, updates) {
    const pantryMap = this._getPantryMap();
    
    if (pantryMap[productId]) {
      pantryMap[productId] = {
        ...pantryMap[productId],
        ...updates
      };
      // Keep productNameLower in sync if productName was updated
      if (updates.productName) {
        pantryMap[productId].productNameLower = updates.productName.toLowerCase();
      }
      this._savePantryMap(pantryMap);
    }
    return Object.values(pantryMap);
  }

  // Update quantity of a specific item
  updateItemQuantity(productId, newQuantity) {
    const pantryMap = this._getPantryMap();
    
    if (pantryMap[productId]) {
      if (newQuantity <= 0) {
        // Remove item if quantity is 0 or less
        delete pantryMap[productId];
      } else {
        pantryMap[productId].quantity = newQuantity;
      }
      this._savePantryMap(pantryMap);
    }
    return Object.values(pantryMap);
  }

  // Remove an item from the pantry - O(1) operation
  removeItem(productId) {
    const pantryMap = this._getPantryMap();
    delete pantryMap[productId];
    this._savePantryMap(pantryMap);
    return Object.values(pantryMap);
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
