import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import tripStorage from '../services/tripStorage';
import pantryStorage from '../services/pantryStorage';
import semanticSearchService from '../services/semanticSearch';
import generateGUID from '../utils/guid';
import { Button, Card, Badge, EmptyState, ShoppingCartIcon, PlusIcon, ChevronRightIcon, PackageIcon, SearchIcon, CloseIcon } from '../components/ui';
import PantryItem from '../components/PantryItem';
import ImageCapture from '../components/ImageCapture';

const Home = () => {
  const navigate = useNavigate();
  const [activeTrip, setActiveTrip] = useState(null);
  const [pantryItems, setPantryItems] = useState([]);
  const [editModeItemId, setEditModeItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [capturingImageForItemId, setCapturingImageForItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticSearchReady, setSemanticSearchReady] = useState(false);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const searchDebounceTimer = useRef(null);
  
  const REMOVAL_ANIMATION_DURATION = 300;
  const SEARCH_DEBOUNCE_MS = 300;

  // Check user's motion preference
  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useEffect(() => {
    const trip = tripStorage.getActiveTrip();
    setActiveTrip(trip);
    const items = pantryStorage.getAllItems();
    setPantryItems(items);

    // Initialize semantic search model
    const initSemanticSearch = async () => {
      try {
        await semanticSearchService.initialize();
        setSemanticSearchReady(true);
      } catch (error) {
        console.error('Failed to initialize semantic search:', error);
        setSemanticSearchReady(false);
      }
    };

    initSemanticSearch();
  }, []);

  // State for exact match and semantic search results
  const [exactMatchItems, setExactMatchItems] = useState([]);
  const [relatedItems, setRelatedItems] = useState([]);

  /**
   * Perform both exact match and semantic search in parallel
   * Exact matches are shown first, semantic matches in "Related products" section
   */
  const performSearch = useCallback(async (query, items) => {
    if (!query || query.trim() === '') {
      setExactMatchItems(items);
      setRelatedItems([]);
      setIsSemanticSearching(false);
      return;
    }

    // Always perform text-based exact match search
    const textResults = pantryStorage.searchByName(query);
    setExactMatchItems(textResults);

    // If semantic search is ready, also perform semantic search
    if (semanticSearchReady) {
      try {
        setIsSemanticSearching(true);
        const semanticResults = await semanticSearchService.searchKNN(query, items, 10, 0.3);
        
        // Filter out items that are already in exact matches
        const exactMatchIds = new Set(textResults.map(item => item.productId));
        const relatedOnlyResults = semanticResults.filter(item => !exactMatchIds.has(item.productId));
        
        setRelatedItems(relatedOnlyResults);
      } catch (error) {
        console.error('Semantic search failed:', error);
        setRelatedItems([]);
      } finally {
        setIsSemanticSearching(false);
      }
    } else {
      setRelatedItems([]);
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

  // Memoize total and item counts to avoid redundant calculations
  const totalItemCount = useMemo(() => {
    return pantryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [pantryItems]);

  const exactMatchCount = useMemo(() => {
    return exactMatchItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [exactMatchItems]);

  const relatedItemsCount = useMemo(() => {
    return relatedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [relatedItems]);

  const handleGoShopping = () => {
    const tripId = generateGUID();
    navigate(`/trips?tripId=${tripId}`);
  };

  const handleContinueShopping = () => {
    if (activeTrip) {
      navigate(`/trips?tripId=${activeTrip.tripId}`);
    }
  };

  const handleEditModeChange = (productId, isEditMode) => {
    setEditModeItemId(isEditMode ? productId : null);
  };

  const handleItemUpdate = (productId, updates) => {
    const updatedItems = pantryStorage.updateItem(productId, updates);
    setPantryItems(updatedItems);
  };

  const handleRemoveItem = (productId) => {
    setRemovingItemId(productId);
    
    const animationDuration = prefersReducedMotion ? 0 : REMOVAL_ANIMATION_DURATION;
    
    setTimeout(() => {
      const updatedItems = pantryStorage.removeItem(productId);
      setPantryItems(updatedItems);
      setEditModeItemId(null);
      setRemovingItemId(null);
    }, animationDuration);
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

  return (
    <div className="h-full bg-warm-50 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-5 pt-8 pb-12 text-white">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-1">
              SuperSuper
            </h1>
            <p className="text-primary-100 text-sm">
              Your family shopping companion
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 -mt-6 pb-20">
          <div className="max-w-lg mx-auto space-y-4">
            
            {!activeTrip ? (
              /* Start Shopping Card - shown when no active trip */
              <Card variant="elevated" padding="lg" className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-100 to-accent-50 rounded-full -mr-10 -mt-10 opacity-50" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-accent-100 rounded-xl">
                      <ShoppingCartIcon size={24} className="text-accent-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-warm-900">Start Shopping</h2>
                      <p className="text-sm text-warm-500">Scan products as you shop</p>
                    </div>
                  </div>
                  <Button 
                    variant="accent" 
                    fullWidth 
                    onClick={handleGoShopping}
                    icon={<PlusIcon size={18} />}
                  >
                    New Shopping Trip
                  </Button>
                </div>
              </Card>
            ) : (
              /* Active Trip Summary Card - shown when an active trip exists */
              <Card
                variant="elevated"
                padding="lg"
                className="relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full -mr-10 -mt-10 opacity-50" />
                <div className="relative">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 p-2.5 bg-primary-100 rounded-xl mr-4">
                      <ShoppingCartIcon size={24} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-warm-900">
                        {activeTrip.name}
                      </h2>
                      {activeTrip.supermarketName && (
                        <p className="text-sm text-warm-500 mt-0.5">
                          @ {activeTrip.supermarketName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="primary" size="sm">
                          {activeTrip.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0} items
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="primary" 
                    fullWidth 
                    onClick={handleContinueShopping}
                    icon={<ChevronRightIcon size={18} />}
                    iconPosition="right"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </Card>
            )}

            {/* My Pantry Section */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <PackageIcon size={20} className="text-warm-600" />
                <h2 className="font-semibold text-warm-900">My Pantry</h2>
                {pantryItems.length > 0 && (
                  <Badge variant="secondary" size="sm">
                    {searchQuery.trim() 
                      ? `${exactMatchCount + relatedItemsCount} of ${totalItemCount} items`
                      : `${totalItemCount} items`
                    }
                  </Badge>
                )}
              </div>

              {/* Search Bar - shown only when there are pantry items */}
              {pantryItems.length > 0 && (
                <>
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon size={18} className="text-warm-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder={semanticSearchReady ? 'Search pantry items...' : 'Search pantry items... (loading AI model)'}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-warm-200 rounded-xl text-warm-900 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      aria-label="Search pantry items"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-warm-400 hover:text-warm-600 transition-colors"
                        aria-label="Clear search"
                      >
                        <CloseIcon size={18} />
                      </button>
                    )}
                  </div>
                  {!semanticSearchReady && (
                    <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        Loading semantic search model... This enables smarter search that understands meaning.
                      </p>
                    </div>
                  )}
                </>
              )}
              
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
                  {/* Exact Match Results Section */}
                  {searchQuery.trim() && exactMatchItems.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-semibold text-warm-700">Exact Matches</h3>
                        <Badge variant="primary" size="sm">
                          {exactMatchCount} {exactMatchCount === 1 ? 'item' : 'items'}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {exactMatchItems.map((item) => {
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
                  )}

                  {/* Related Products Section (Semantic Search Results) */}
                  {searchQuery.trim() && relatedItems.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-semibold text-warm-700">Related Products</h3>
                        <Badge variant="secondary" size="sm">
                          {relatedItemsCount} {relatedItemsCount === 1 ? 'item' : 'items'}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {relatedItems.map((item) => {
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
                  )}

                  {/* All Items (when no search query) */}
                  {!searchQuery.trim() && (
                    <div className="space-y-3">
                      {exactMatchItems.map((item) => {
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
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Image Capture Popup */}
      {capturingImageForItemId && (
        <ImageCapture
          onCapture={handleImageCapture}
          onClose={handleImageCaptureClose}
        />
      )}
    </div>
  );
};

export default Home;