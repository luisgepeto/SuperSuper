// Pantry storage service using localStorage for frontend-only persistence
// Manages the user's pantry items that track food at home
const PANTRY_STORAGE_KEY = 'supersuper_pantry';

class PantryStorage {
  // Get all pantry items from localStorage
  getAllItems() {
    try {
      const stored = localStorage.getItem(PANTRY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading pantry from localStorage:', error);
      return [];
    }
  }

  // Save all pantry items to localStorage
  saveAllItems(items) {
    try {
      localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving pantry to localStorage:', error);
    }
  }

  // Add or update items from a completed shopping trip
  // If item exists (by productId), increase quantity; otherwise add new item
  addItemsFromTrip(tripItems) {
    const currentPantry = this.getAllItems();
    
    tripItems.forEach((tripItem) => {
      // Use barcode as the product identifier
      const productId = tripItem.barcode;
      if (!productId) {
        console.warn('Skipping trip item without barcode:', tripItem);
        return;
      }

      const existingItemIndex = currentPantry.findIndex(
        (item) => item.productId === productId
      );

      if (existingItemIndex !== -1) {
        // Item exists, increase quantity and update image if available
        currentPantry[existingItemIndex].quantity += tripItem.quantity || 1;
        // Update image if we have one and the pantry item doesn't
        if ((tripItem.image || tripItem.thumbnail) && !currentPantry[existingItemIndex].image) {
          currentPantry[existingItemIndex].image = tripItem.image || tripItem.thumbnail;
        }
      } else {
        // New item, add to pantry with image
        currentPantry.push({
          productId: productId,
          productName: tripItem.productName || productId,
          quantity: tripItem.quantity || 1,
          image: tripItem.image || tripItem.thumbnail || null
        });
      }
    });

    this.saveAllItems(currentPantry);
    return currentPantry;
  }

  // Update a pantry item (name, quantity, image)
  updateItem(productId, updates) {
    const items = this.getAllItems();
    const itemIndex = items.findIndex((item) => item.productId === productId);
    
    if (itemIndex !== -1) {
      items[itemIndex] = {
        ...items[itemIndex],
        ...updates
      };
      this.saveAllItems(items);
    }
    return items;
  }

  // Update quantity of a specific item
  updateItemQuantity(productId, newQuantity) {
    const items = this.getAllItems();
    const itemIndex = items.findIndex((item) => item.productId === productId);
    
    if (itemIndex !== -1) {
      if (newQuantity <= 0) {
        // Remove item if quantity is 0 or less
        items.splice(itemIndex, 1);
      } else {
        items[itemIndex].quantity = newQuantity;
      }
      this.saveAllItems(items);
    }
    return items;
  }

  // Remove an item from the pantry
  removeItem(productId) {
    const items = this.getAllItems();
    const filteredItems = items.filter((item) => item.productId !== productId);
    this.saveAllItems(filteredItems);
    return filteredItems;
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
