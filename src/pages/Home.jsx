import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import pantryStorage from '../services/pantryStorage';
import settingsStorage from '../services/settingsStorage';
import { Card, Badge, EmptyState, PackageIcon, SearchIcon, CloseIcon, Toast } from '../components/ui';
import PantryItem from '../components/PantryItem';
import ImageCapture from '../components/ImageCapture';

const SEARCH_DEBOUNCE_MS = 300;
const REMOVAL_ANIMATION_DURATION = 300;
const INITIAL_RELATED_RESULTS = 10; // Initial number of related products to display
const LAZY_LOAD_INCREMENT = 5; // Number of additional results to show when "Show more" is clicked
const INITIAL_FETCH_COUNT = 15; // Number of results to fetch on first search (show 10, keep 5 for lazy load)
const PRELOAD_TRIGGER_COUNT = 15; // When displayed count reaches this, pre-load next batch
const EXTENDED_FETCH_COUNT = 35; // Number of results to fetch for pre-loading next batch

// Category display order for pantry view
const CATEGORY_ORDER = [
  'Fruits & vegetables',
  'Meat & seafood',
  'Bakery & bread',
  'Dairy & eggs',
  'Deli & prepared food',
  'Pantry',
  'Frozen food',
  'Beverages',
  'Everyday essentials',
  'Health & beauty',
  'Home & outdoor',
  'Baby & kids',
  'Pets',
  'Other'
];

// Helper function to calculate total quantity for a list of items
const getTotalQuantity = (items) => {
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};

// Reusable sticky section header component for search results
const StickySearchHeader = ({ title, count, showCount = true }) => (
  <div className="sticky top-0 z-10 bg-warm-50 -mx-4 px-4 py-2 border-b border-warm-200">
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-semibold text-warm-700">{title}</h3>
      {showCount && count > 0 && (
        <Badge variant="primary" size="sm">
          {count} {count === 1 ? 'item' : 'items'}
        </Badge>
      )}
    </div>
  </div>
);

// Category header component for pantry view
const CategoryHeader = ({ title, count }) => (
  <div className="sticky top-0 z-10 bg-warm-50 -mx-4 px-4 py-2 border-b border-warm-200 mt-4 first:mt-0">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-warm-700">{title}</h3>
      <Badge variant="secondary" size="sm">
        {count}
      </Badge>
    </div>
  </div>
);

const Home = () => {
  const [pantryItems, setPantryItems] = useState([]);
  const [editModeItemId, setEditModeItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [capturingImageForItemId, setCapturingImageForItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticSearchReady, setSemanticSearchReady] = useState(false);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const searchDebounceTimer = useRef(null);
  
  // Toast state for undo functionality
  const [toastVisible, setToastVisible] = useState(false);
  const [removedItem, setRemovedItem] = useState(null);
  const [removedItemIndex, setRemovedItemIndex] = useState(null);
  
  // Cache for semantic search service to avoid repeated dynamic imports
  const semanticSearchServiceCache = useRef(null);

  // Check user's motion preference
  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    const items = pantryStorage.getAllItems();
    setPantryItems(items);

    // Listen for pantry updates (e.g., when categories are updated asynchronously)
    const handlePantryUpdate = () => {
      const updatedItems = pantryStorage.getAllItems();
      setPantryItems(updatedItems);
    };

    window.addEventListener('pantryUpdated', handlePantryUpdate);

    // Initialize semantic search model only if feature is enabled
    const isSemanticSearchFeatureEnabled = settingsStorage.isSemanticSearchEnabled();
    
    if (isSemanticSearchFeatureEnabled) {
      const initSemanticSearch = async () => {
        try {
          // Dynamically import the semantic search service only when needed
          if (!semanticSearchServiceCache.current) {
            const module = await import('../services/semanticSearch');
            semanticSearchServiceCache.current = module.default;
          }
          await semanticSearchServiceCache.current.initialize();
          setSemanticSearchReady(true);
        } catch (error) {
          console.error('Failed to initialize semantic search:', error);
          setSemanticSearchReady(false);
        }
      };

      initSemanticSearch();
    }

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('pantryUpdated', handlePantryUpdate);
    };
  }, []);

  // State for exact match and semantic search results
  const [exactMatchItems, setExactMatchItems] = useState([]);
  const [relatedItems, setRelatedItems] = useState([]);
  
  // State for lazy loading related products
  const [allRelatedItems, setAllRelatedItems] = useState([]); // All semantic results
  const [displayedRelatedCount, setDisplayedRelatedCount] = useState(INITIAL_RELATED_RESULTS); // How many to show
  const [isLoadingMoreRelated, setIsLoadingMoreRelated] = useState(false);

  /**
   * Perform both exact match and semantic search in parallel
   * Exact matches are shown first, semantic matches in "Related products" section
   */
  const performSearch = useCallback(async (query, items) => {
    if (!query || query.trim() === '') {
      setExactMatchItems(items);
      setRelatedItems([]);
      setAllRelatedItems([]);
      setDisplayedRelatedCount(INITIAL_RELATED_RESULTS);
      setIsSemanticSearching(false);
      return;
    }

    // Always perform text-based exact match search
    const textResults = pantryStorage.searchByName(query);
    setExactMatchItems(textResults);

    // If semantic search is ready, also perform semantic search
    if (semanticSearchReady && semanticSearchServiceCache.current) {
      try {
        setIsSemanticSearching(true);
        // Query for INITIAL_FETCH_COUNT results for lazy loading (show INITIAL_RELATED_RESULTS, keep extras hidden)
        const semanticResults = await semanticSearchServiceCache.current.searchKNN(query, items, INITIAL_FETCH_COUNT, 0.3);
        
        // Filter out items that are already in exact matches
        const exactMatchIds = new Set(textResults.map(item => item.productId));
        const relatedOnlyResults = semanticResults.filter(item => !exactMatchIds.has(item.productId));
        
        // Store all results and reset display count
        setAllRelatedItems(relatedOnlyResults);
        setDisplayedRelatedCount(INITIAL_RELATED_RESULTS);
        
        // Show first INITIAL_RELATED_RESULTS results
        setRelatedItems(relatedOnlyResults.slice(0, INITIAL_RELATED_RESULTS));
      } catch (error) {
        console.error('Semantic search failed:', error);
        setRelatedItems([]);
        setAllRelatedItems([]);
      } finally {
        setIsSemanticSearching(false);
      }
    } else {
      setRelatedItems([]);
      setAllRelatedItems([]);
      setIsSemanticSearching(false);
    }
  }, [semanticSearchReady]);

  /**
   * Update filtered items when search query or pantry items change
   * Debounce search to avoid excessive API calls while typing
   */
  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    searchDebounceTimer.current = setTimeout(() => {
      performSearch(searchQuery, pantryItems);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [searchQuery, pantryItems, performSearch]);

  /**
   * Filter pantry items based on search query
   * 
   * SEARCH EXECUTION FLOW:
   * ======================
   * 
   * 1. When user types in search box, searchQuery state is updated
   * 2. This triggers useEffect with debouncing (300ms)
   * 3. performSearch is called which runs BOTH searches in parallel:
   *    a. Text-based exact match search via pantryStorage.searchByName()
   *    b. Semantic search (if model is ready) via semanticSearchService.searchKNN()
   * 
   * Results are separated into two sections:
   * - Exact matches: Items that match the search query by text
   * - Related products: Semantic matches excluding exact matches
   * 
   * Semantic Search (when available):
   * - Generates embeddings for query and items
   * - Calculates cosine similarity between query and each item
   * - Returns top K items above similarity threshold (0.3)
   * - Enables finding semantically related items (e.g., "pasta" matches "spaghetti")
   * 
   * Text Search:
   * - See pantryStorage.js for detailed algorithm documentation
   * - Word-based substring matching using pre-built index
   */

  // Helper function to group items by category
  const groupItemsByCategory = useCallback((items) => {
    const grouped = {};
    
    // Initialize all categories (to maintain order)
    CATEGORY_ORDER.forEach(category => {
      grouped[category] = [];
    });
    
    // Group items by their category (default to 'Other' for unknown categories)
    items.forEach(item => {
      const category = item.category || 'Other';
      const targetCategory = grouped[category] ? category : 'Other';
      grouped[targetCategory].push(item);
    });
    
    // Return only non-empty categories with their index for stable keys
    return CATEGORY_ORDER
      .map((category, index) => ({ category, items: grouped[category], index }))
      .filter(({ items }) => items.length > 0);
  }, []);

  // Group pantry items by category for display (unfiltered view)
  const itemsByCategory = useMemo(() => {
    return groupItemsByCategory(pantryItems);
  }, [pantryItems, groupItemsByCategory]);

  // Group exact match search results by category
  const exactMatchesByCategory = useMemo(() => {
    return groupItemsByCategory(exactMatchItems);
  }, [exactMatchItems, groupItemsByCategory]);

  // Group related items (semantic search results) by category
  const relatedItemsByCategory = useMemo(() => {
    return groupItemsByCategory(relatedItems);
  }, [relatedItems, groupItemsByCategory]);

  // Memoize total and item counts for exact match and semantic search results
  const totalItemCount = useMemo(() => {
    return getTotalQuantity(pantryItems);
  }, [pantryItems]);

  const exactMatchCount = useMemo(() => {
    return getTotalQuantity(exactMatchItems);
  }, [exactMatchItems]);

  const relatedItemsCount = useMemo(() => {
    return getTotalQuantity(relatedItems);
  }, [relatedItems]);

  const handleEditModeChange = (productId, isEditMode) => {
    setEditModeItemId(isEditMode ? productId : null);
  };

  const handleItemUpdate = (productId, updates) => {
    const updatedItems = pantryStorage.updateItem(productId, updates);
    setPantryItems(updatedItems);
  };

  const handleRemoveItem = (productId) => {
    // Store the item before removing for undo functionality
    const itemToRemove = pantryItems.find(item => item.productId === productId);
    const itemIndex = pantryItems.findIndex(item => item.productId === productId);
    
    setRemovingItemId(productId);
    
    const animationDuration = prefersReducedMotion ? 0 : REMOVAL_ANIMATION_DURATION;
    
    setTimeout(() => {
      const updatedItems = pantryStorage.removeItem(productId);
      setPantryItems(updatedItems);
      setEditModeItemId(null);
      setRemovingItemId(null);
      
      // Show toast with undo option
      if (itemToRemove && itemIndex !== -1) {
        setRemovedItem(itemToRemove);
        setRemovedItemIndex(itemIndex);
        setToastVisible(true);
      }
    }, animationDuration);
  };

  const handleUndoRemove = () => {
    if (removedItem && removedItemIndex !== null) {
      // Re-add the item to the pantry storage using the public API
      const restoredItems = pantryStorage.addItemsFromTrip([{
        barcode: removedItem.productId,
        productName: removedItem.productName,
        quantity: removedItem.quantity,
        image: removedItem.image
      }]);
      
      // Reorder items to restore original position
      // Find the newly added item and move it to the correct position
      const newlyAddedItem = restoredItems.find(item => item.productId === removedItem.productId);
      const itemsWithoutRestored = restoredItems.filter(item => item.productId !== removedItem.productId);
      
      // Insert at original position
      const reorderedItems = [
        ...itemsWithoutRestored.slice(0, removedItemIndex),
        newlyAddedItem,
        ...itemsWithoutRestored.slice(removedItemIndex)
      ];
      
      setPantryItems(reorderedItems);
      setRemovedItem(null);
      setRemovedItemIndex(null);
    }
  };

  const handleToastClose = () => {
    setToastVisible(false);
    setRemovedItem(null);
    setRemovedItemIndex(null);
  };

  const handleImageCaptureRequest = (productId) => {
    setCapturingImageForItemId(productId);
  };

  const handleImageCapture = (imageData) => {
    if (capturingImageForItemId) {
      const item = pantryItems.find(item => item.productId === capturingImageForItemId);
      if (item) {
        const updatedItems = pantryStorage.updateItem(capturingImageForItemId, {
          image: imageData
        });
        setPantryItems(updatedItems);
      }
    }
    setCapturingImageForItemId(null);
  };

  const handleImageCaptureClose = () => {
    setCapturingImageForItemId(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  /**
   * Handle loading more related products
   * Shows LAZY_LOAD_INCREMENT more results each time
   */
  const handleLoadMoreRelated = async () => {
    setIsLoadingMoreRelated(true);
    
    // Show LAZY_LOAD_INCREMENT more results (up to total available)
    const newCount = Math.min(displayedRelatedCount + LAZY_LOAD_INCREMENT, allRelatedItems.length);
    setDisplayedRelatedCount(newCount);
    setRelatedItems(allRelatedItems.slice(0, newCount));
    
    // If we're showing PRELOAD_TRIGGER_COUNT and there might be more, pre-load next batch
    if (newCount >= PRELOAD_TRIGGER_COUNT && searchQuery && semanticSearchReady && semanticSearchServiceCache.current) {
      try {
        // Query for more results up to EXTENDED_FETCH_COUNT total
        const moreResults = await semanticSearchServiceCache.current.searchKNN(searchQuery, pantryItems, EXTENDED_FETCH_COUNT, 0.3);
        const exactMatchIds = new Set(exactMatchItems.map(item => item.productId));
        const relatedOnlyResults = moreResults.filter(item => !exactMatchIds.has(item.productId));
        
        // Only update if we got more results than currently stored
        if (relatedOnlyResults.length > allRelatedItems.length) {
          setAllRelatedItems(relatedOnlyResults);
          // Update displayed items if needed (keep current count but with fresh data)
          setRelatedItems(relatedOnlyResults.slice(0, newCount));
        }
      } catch (error) {
        console.error('Failed to pre-load more results:', error);
      }
    }
    
    setIsLoadingMoreRelated(false);
  };

  return (
    <div className="h-full bg-warm-50 flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <header className="flex-shrink-0 bg-gradient-to-br from-primary-600 to-primary-700 text-white sticky top-0 z-10">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold">
              My Pantry
            </h1>
            {pantryItems.length > 0 && (
              <Badge variant="primary" size="sm" className="bg-white/20 text-white">
                {searchQuery.trim() 
                  ? `${exactMatchCount + relatedItemsCount} of ${totalItemCount}`
                  : `${totalItemCount} items`
                }
              </Badge>
            )}
          </div>
          <p className="text-sm text-primary-100">
            Your purchased products
          </p>
          
          {/* Search Bar - inside sticky header when there are pantry items */}
          {pantryItems.length > 0 && (
            <div className="relative mt-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-primary-300" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search pantry items..."
                className="w-full pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                aria-label="Search pantry items"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-200 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <CloseIcon size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-20">
          <div className="max-w-lg mx-auto">
            {pantryItems.length === 0 ? (
              <Card variant="filled" padding="lg">
                <EmptyState
                  icon={<PackageIcon size={36} />}
                  title="Your pantry is empty"
                  description="Complete a shopping trip to add items to your pantry"
                />
              </Card>
            ) : exactMatchItems.length === 0 && relatedItems.length === 0 && searchQuery.trim() ? (
              <Card variant="filled" padding="lg">
                <EmptyState
                  icon={<SearchIcon size={36} />}
                  title="No items found"
                  description={`No pantry items match "${searchQuery.substring(0, 50)}"`}
                />
              </Card>
            ) : (
              <>
                {/* Exact Match Results Section - grouped by category */}
                {searchQuery.trim() && exactMatchItems.length > 0 && (
                  <div className="mb-6">
                    <StickySearchHeader title="Exact Matches" count={exactMatchCount} />
                    <div className="pt-2">
                      {exactMatchesByCategory.map(({ category, items, index }) => (
                        <div key={`exact-category-${index}`} className="mb-4">
                          <CategoryHeader 
                            title={category} 
                            count={getTotalQuantity(items)} 
                          />
                          <div className="space-y-3 pt-3">
                            {items.map((item) => {
                              const isRemoving = removingItemId === item.productId;
                              
                              return (
                                <div
                                  key={item.productId}
                                  className={`${
                                    !prefersReducedMotion ? 'transition-all duration-300 ease-in-out' : ''
                                  } ${
                                    isRemoving
                                      ? 'opacity-0 scale-95 translate-x-4'
                                      : 'opacity-100 scale-100 translate-x-0'
                                  }`}
                                >
                                  <PantryItem 
                                    item={item}
                                    onItemUpdate={handleItemUpdate}
                                    onRemove={handleRemoveItem}
                                    isEditMode={editModeItemId === item.productId}
                                    onEditModeChange={(isEditMode) => handleEditModeChange(item.productId, isEditMode)}
                                    onImageCaptureRequest={() => handleImageCaptureRequest(item.productId)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Products Section (Semantic Search Results) - grouped by category */}
                {searchQuery.trim() && (semanticSearchReady || (!semanticSearchReady && settingsStorage.isSemanticSearchEnabled())) && (
                  <div className="mb-6">
                    <StickySearchHeader title="Related Products" count={relatedItemsCount} showCount={relatedItems.length > 0} />
                    
                    {/* Loading state inside Related Products section */}
                    {!semanticSearchReady && settingsStorage.isSemanticSearchEnabled() && (
                      <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700">
                          Loading semantic search model... This enables smarter search that understands meaning.
                        </p>
                      </div>
                    )}
                    
                    {/* No related items found message */}
                    {semanticSearchReady && relatedItems.length === 0 && !isSemanticSearching && (
                      <Card variant="filled" padding="md" className="mt-3">
                        <p className="text-sm text-warm-600 text-center">
                          No related items found
                        </p>
                      </Card>
                    )}
                    
                    {/* Related items list grouped by category */}
                    {relatedItems.length > 0 && (
                      <>
                        <div className="pt-2">
                          {relatedItemsByCategory.map(({ category, items, index }) => (
                            <div key={`related-category-${index}`} className="mb-4">
                              <CategoryHeader 
                                title={category} 
                                count={getTotalQuantity(items)} 
                              />
                              <div className="space-y-3 pt-3">
                                {items.map((item) => {
                                  const isRemoving = removingItemId === item.productId;
                                  
                                  return (
                                    <div
                                      key={item.productId}
                                      className={`${
                                        !prefersReducedMotion ? 'transition-all duration-300 ease-in-out' : ''
                                      } ${
                                        isRemoving
                                          ? 'opacity-0 scale-95 translate-x-4'
                                          : 'opacity-100 scale-100 translate-x-0'
                                      }`}
                                    >
                                      <PantryItem 
                                        item={item}
                                        onItemUpdate={handleItemUpdate}
                                        onRemove={handleRemoveItem}
                                        isEditMode={editModeItemId === item.productId}
                                        onEditModeChange={(isEditMode) => handleEditModeChange(item.productId, isEditMode)}
                                        onImageCaptureRequest={() => handleImageCaptureRequest(item.productId)}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Show More Button - appears when there are more results available */}
                        {allRelatedItems.length > displayedRelatedCount && (
                          <div className="mt-4">
                            <button
                              onClick={handleLoadMoreRelated}
                              disabled={isLoadingMoreRelated}
                              className="w-full py-3 px-4 bg-white border border-primary-200 text-primary-600 rounded-xl font-medium hover:bg-primary-50 hover:border-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoadingMoreRelated ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Loading...
                                </span>
                              ) : (
                                `Show ${Math.min(LAZY_LOAD_INCREMENT, allRelatedItems.length - displayedRelatedCount)} more related results`
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* All Items grouped by category (when no search query) */}
                {!searchQuery.trim() && (
                  <div>
                    {itemsByCategory.map(({ category, items, index }) => (
                      <div key={`category-${index}`} className="mb-4">
                        <CategoryHeader 
                          title={category} 
                          count={getTotalQuantity(items)} 
                        />
                        <div className="space-y-3 pt-3">
                          {items.map((item) => {
                            const isRemoving = removingItemId === item.productId;
                            
                            return (
                              <div
                                key={item.productId}
                                className={`${
                                  !prefersReducedMotion ? 'transition-all duration-300 ease-in-out' : ''
                                } ${
                                  isRemoving
                                    ? 'opacity-0 scale-95 translate-x-4'
                                    : 'opacity-100 scale-100 translate-x-0'
                                }`}
                              >
                                <PantryItem 
                                  item={item}
                                  onItemUpdate={handleItemUpdate}
                                  onRemove={handleRemoveItem}
                                  isEditMode={editModeItemId === item.productId}
                                  onEditModeChange={(isEditMode) => handleEditModeChange(item.productId, isEditMode)}
                                  onImageCaptureRequest={() => handleImageCaptureRequest(item.productId)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Image Capture Popup */}
      {capturingImageForItemId && (
        <ImageCapture
          onCapture={handleImageCapture}
          onClose={handleImageCaptureClose}
        />
      )}

      {/* Removal Toast with Undo */}
      <Toast
        isVisible={toastVisible}
        message={removedItem ? `"${removedItem.productName || removedItem.productId}" removed from pantry` : ''}
        onUndo={handleUndoRemove}
        onClose={handleToastClose}
        variant="warning"
      />
    </div>
  );
};

export default Home;