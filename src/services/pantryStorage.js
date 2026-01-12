// Pantry storage service using localStorage for frontend-only persistence
// Manages the user's pantry items that track food at home
//
// Storage Schema (optimized for O(1) search by both productId and productName):
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
//   }
// }
//
// - items: Object with productId as key enables O(1) lookup by barcode/productId
// - nameIndex: Object with lowercase productName as key, value is array of productIds
//   This handles name collisions (multiple products can have the same name)
// - productNameLower field on items enables efficient case-insensitive partial name search
//
const PANTRY_STORAGE_KEY = 'supersuper_pantry';

class PantryStorage {
  // Get raw pantry data (for internal use)
  _getPantryData() {
    try {
      const stored = localStorage.getItem(PANTRY_STORAGE_KEY);
      if (!stored) {
        return { items: {}, nameIndex: {} };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading pantry from localStorage:', error);
      return { items: {}, nameIndex: {} };
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
        data.items[productId].quantity += tripItem.quantity || 1;
        // Update image if we have one and the pantry item doesn't
        if ((tripItem.image || tripItem.thumbnail) && !data.items[productId].image) {
          data.items[productId].image = tripItem.image || tripItem.thumbnail;
        }
        // Update name index if name changed
        if (oldNameLower !== productNameLower) {
          this._removeFromNameIndex(data, oldNameLower, productId);
          this._addToNameIndex(data, productNameLower, productId);
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
        // Add to name index
        this._addToNameIndex(data, productNameLower, productId);
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
      
      data.items[productId] = {
        ...data.items[productId],
        ...updates
      };
      
      // Update name index if productName was updated
      if (updates.productName) {
        const newNameLower = updates.productName.toLowerCase();
        data.items[productId].productNameLower = newNameLower;
        // Update name index
        if (oldNameLower !== newNameLower) {
          this._removeFromNameIndex(data, oldNameLower, productId);
          this._addToNameIndex(data, newNameLower, productId);
        }
      }
      this._savePantryData(data);
    }
    return Object.values(data.items);
  }

  // Update quantity of a specific item
  updateItemQuantity(productId, newQuantity) {
    const data = this._getPantryData();
    
    if (data.items[productId]) {
      if (newQuantity <= 0) {
        // Remove item if quantity is 0 or less
        const nameLower = data.items[productId].productNameLower;
        this._removeFromNameIndex(data, nameLower, productId);
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
      this._removeFromNameIndex(data, nameLower, productId);
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
