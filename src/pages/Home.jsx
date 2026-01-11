import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import tripStorage from '../services/tripStorage';
import pantryStorage from '../services/pantryStorage';
import generateGUID from '../utils/guid';
import { Button, Card, Badge, EmptyState, ShoppingCartIcon, PlusIcon, ChevronRightIcon, PackageIcon } from '../components/ui';
import PantryItem from '../components/PantryItem';
import ImageCapture from '../components/ImageCapture';

const Home = () => {
  const navigate = useNavigate();
  const [activeTrip, setActiveTrip] = useState(null);
  const [pantryItems, setPantryItems] = useState([]);
  const [editModeItemId, setEditModeItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [capturingImageForItemId, setCapturingImageForItemId] = useState(null);
  
  const REMOVAL_ANIMATION_DURATION = 300;

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
  }, []);

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
        <div className="flex-1 px-4 -mt-6 pb-6">
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
                    {pantryItems.reduce((sum, item) => sum + (item.quantity || 0), 0)} items
                  </Badge>
                )}
              </div>
              
              {pantryItems.length === 0 ? (
                <Card variant="filled" padding="lg">
                  <EmptyState
                    icon={<PackageIcon size={36} />}
                    title="Your pantry is empty"
                    description="Complete a shopping trip to add items to your pantry"
                  />
                </Card>
              ) : (
                <div className="space-y-3">
                  {pantryItems.map((item) => {
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