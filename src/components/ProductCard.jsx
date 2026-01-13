import { useState, useRef, useEffect } from 'react';
import { Card, ImageIcon, PlusIcon, MinusIcon, ShoppingCartIcon, TrashIcon, EditIcon, CheckIcon, CameraIcon } from './ui';

// Validation patterns for input fields
const PRICE_PATTERN = /^\d*\.?\d{0,2}$/;
const QUANTITY_PATTERN = /^\d+$/;

// Format ISO date string to a user-friendly format (e.g., "Jan 13, 2026")
const formatLastBoughtDate = (isoDateString) => {
  if (!isoDateString) return null;
  try {
    const date = new Date(isoDateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return null;
  }
};

const ProductCard = ({ 
  product, 
  quantity = 1, 
  onQuantityChange, 
  onRemove, 
  onProductUpdate,
  isEditMode: externalEditMode,
  onEditModeChange,
  onImageCaptureRequest,
  lastBoughtOn 
}) => {
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editThumbnail, setEditThumbnail] = useState(null);
  const cardRef = useRef(null);
  const nameInputRef = useRef(null);
  const priceInputRef = useRef(null);

  // Use external edit mode if provided, otherwise use internal state
  const isEditMode = externalEditMode !== undefined ? externalEditMode : internalEditMode;
  const setEditMode = (value) => {
    if (onEditModeChange) {
      onEditModeChange(value);
    } else {
      setInternalEditMode(value);
    }
  };



  // Initialize edit fields when entering edit mode
  useEffect(() => {
    if (isEditMode && product) {
      const unitPrice = product.price;
      setEditName(product.productName || product.barcode || '');
      // Store price as cents (integer) for the new input behavior
      // Use toFixed(0) to avoid floating-point precision errors
      const priceInCents = unitPrice ? Number((unitPrice * 100).toFixed(0)) : 0;
      setEditPrice(String(priceInCents));
      setEditQuantity(String(quantity));
      setEditThumbnail(product.image || product.thumbnail || null);
    }
  }, [isEditMode, product, quantity]);

  // Scroll card to top and focus name input when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling and selecting text
      // This is especially important on mobile where the keyboard appearance might interfere
      const rafId = requestAnimationFrame(() => {
        // Scroll the card to the top of the viewport to prevent keyboard from covering it
        if (cardRef.current) {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          cardRef.current.scrollIntoView({ 
            behavior: prefersReducedMotion ? 'instant' : 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
        
        // Focus and select the name input
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          // Only select text if there is content to select
          if (nameInputRef.current.value) {
            nameInputRef.current.select();
          }
        }
      });
      
      // Cleanup function to cancel animation frame if component unmounts or effect re-runs
      return () => {
        cancelAnimationFrame(rafId);
      };
    }
  }, [isEditMode]);

  if (!product) {
    return null;
  }

  const displayData = {
    name: product.productName || product.barcode || 'Unknown Product',
    barcode: product.barcode,
    thumbnail: product.image || product.thumbnail || null,
    unitPrice: product.price || null,
    // A product has a valid price if it's a positive number
    hasPrice: typeof product.price === 'number' && product.price > 0,
    lastBoughtOn: formatLastBoughtDate(lastBoughtOn)
  };

  // Get current values based on mode
  const currentThumbnail = isEditMode ? editThumbnail : displayData.thumbnail;
  const currentName = isEditMode ? editName : displayData.name;
  const currentQuantity = isEditMode ? (parseInt(editQuantity, 10) || 1) : quantity;



  const handleIncrement = (e) => {
    e.stopPropagation();
    if (isEditMode) {
      const newQty = parseInt(editQuantity, 10) || 0;
      setEditQuantity(String(newQty + 1));
    } else if (onQuantityChange) {
      onQuantityChange(product.id, quantity + 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (isEditMode) {
      const newQty = parseInt(editQuantity, 10) || 0;
      if (newQty > 1) {
        setEditQuantity(String(newQty - 1));
      }
    } else {
      if (quantity === 1) {
        if (onRemove) {
          onRemove(product.id);
        }
      } else if (onQuantityChange) {
        onQuantityChange(product.id, quantity - 1);
      }
    }
  };

  const handleEnterEditMode = (e) => {
    e.stopPropagation();
    setEditMode(true);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    
    // Convert cents back to dollars
    // Check for empty string first to distinguish from zero price
    const priceInCents = editPrice === '' ? 0 : parseInt(editPrice, 10);
    const priceInDollars = priceInCents / 100;
    // Only save a positive price; 0 or empty means no price (will show as "-")
    const validPrice = priceInDollars > 0 ? priceInDollars : null;
    
    const updatedProduct = {
      ...product,
      productName: editName.trim() || product.barcode,
      price: validPrice,
      image: editThumbnail,
      thumbnail: editThumbnail,
    };

    const newQuantity = Math.max(1, parseInt(editQuantity, 10) || 1);

    if (onProductUpdate) {
      onProductUpdate(product.id, updatedProduct, newQuantity);
    }

    setEditMode(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(product.id);
    }
  };

  const handleOpenCamera = () => {
    if (onImageCaptureRequest) {
      onImageCaptureRequest();
    }
  };

  const handleQuantityInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || QUANTITY_PATTERN.test(value)) {
      setEditQuantity(value);
    }
  };

  const handleQuantityInputBlur = () => {
    // Ensure minimum of 1 when losing focus
    const qty = parseInt(editQuantity, 10);
    if (!qty || qty < 1) {
      setEditQuantity('1');
    }
  };

  // Thumbnail component - always editable when no thumbnail exists
  const renderThumbnail = () => {
    // If there's no thumbnail, always show editable state (regardless of edit mode)
    if (!currentThumbnail) {
      return (
        <button
          onClick={handleOpenCamera}
          className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden mr-3 border-2 border-dashed border-warm-300 hover:border-accent-400 transition-colors relative group"
          aria-label="Add product image"
        >
          <div className="flex flex-col items-center text-warm-400">
            <CameraIcon size={20} />
            <span className="text-[10px] mt-0.5">Photo</span>
          </div>
        </button>
      );
    }

    // If in edit mode and thumbnail exists, show editable overlay
    if (isEditMode) {
      return (
        <button
          onClick={handleOpenCamera}
          className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden mr-3 border-2 border-warm-200 hover:border-accent-400 transition-colors relative group"
          aria-label="Change product image"
        >
          <img 
            src={currentThumbnail} 
            alt={currentName || 'Product'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <CameraIcon size={20} className="text-white" />
          </div>
        </button>
      );
    }

    // Normal display mode with thumbnail
    return (
      <div className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden mr-3">
        <img 
          src={currentThumbnail} 
          alt={currentName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  // Header section with name and action buttons
  const renderHeader = () => {
    if (isEditMode) {
      return (
        <div className="flex items-start gap-2">
          <input
            ref={nameInputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Product name"
            className="flex-1 min-w-0 px-3 py-2 text-sm font-semibold text-warm-900 bg-warm-50 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
          />
          <div className="flex-shrink-0 flex items-center gap-1">
            <button
              onClick={handleSaveEdit}
              className="p-1.5 text-accent-600 hover:text-accent-700 hover:bg-accent-50 rounded-lg transition-colors"
              aria-label="Save changes"
            >
              <CheckIcon size={16} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-warm-900 leading-tight line-clamp-2 flex-1 mr-2">
          {currentName}
        </h3>
        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            onClick={handleEnterEditMode}
            className="p-1 text-warm-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
            aria-label="Edit product"
          >
            <EditIcon size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Price display/input
  const renderPrice = () => {
    if (isEditMode) {
      // Format the cents value for display
      const priceInCents = parseInt(editPrice, 10) || 0;
      const dollars = Math.floor(priceInCents / 100);
      const cents = priceInCents % 100;
      const displayPrice = `${dollars}.${cents.toString().padStart(2, '0')}`;
      
      return (
        <div className="flex items-center flex-shrink-0">
          <span className="text-base font-bold text-primary-700 mr-1">$</span>
          <input
            ref={priceInputRef}
            type="text"
            inputMode="numeric"
            value={displayPrice}
            onChange={(e) => {
              const value = e.target.value;
              // Extract only digits from the input - removes decimal points, spaces, etc.
              const digitsOnly = value.replace(/\D/g, '');
              
              // Update the cents value - allow empty string for clearing
              setEditPrice(digitsOnly);
            }}
            onFocus={(e) => e.target.select()}
            className="w-16 px-2 py-1.5 text-base font-bold text-primary-700 bg-warm-50 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
          />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs text-warm-500">Unit price</span>
        <p className="text-base font-bold text-primary-700">
          {displayData.hasPrice ? `$${displayData.unitPrice.toFixed(2)}` : '$\u2014'}
        </p>
      </div>
    );
  };

  // Quantity controls
  const renderQuantityControls = () => {
    const borderClass = isEditMode ? 'border-warm-200' : 'border-warm-100';
    
    // Calculate shopping cart icon spacing based on mode and quantity
    // When quantity is 1 or in edit mode, trash icon appears on the left,
    // so we add extra left margin for visual balance
    let cartIconClass = 'text-primary-600';
    if ((!isEditMode && quantity === 1) || isEditMode) {
      cartIconClass += ' ml-1.5 mr-1';
    } else {
      cartIconClass += ' mr-1.5';
    }
    
    return (
      <div className={`flex items-center bg-warm-50 rounded-xl border flex-shrink-0 ${borderClass}`}>
        {isEditMode ? (
          <button
            onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-l-xl transition-colors flex-shrink-0"
            aria-label="Delete product"
          >
            <TrashIcon size={14} />
          </button>
        ) : (
          <button
            onClick={handleDecrement}
            className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-l-xl transition-colors"
          >
            {quantity === 1 ? (
              <TrashIcon size={16} />
            ) : (
              <MinusIcon size={16} />
            )}
          </button>
        )}
        {isEditMode && currentQuantity > 1 && (
          <button
            onClick={handleDecrement}
            className="w-7 h-7 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors flex-shrink-0"
          >
            <MinusIcon size={14} />
          </button>
        )}
        <div className={`flex items-center justify-center ${isEditMode ? '' : 'px-2'}`}>
          <ShoppingCartIcon size={isEditMode ? 12 : 14} className={cartIconClass} />
          {isEditMode ? (
            <input
              type="text"
              inputMode="numeric"
              value={editQuantity}
              onChange={handleQuantityInputChange}
              onBlur={handleQuantityInputBlur}
              className="w-7 text-center text-sm font-medium text-warm-800 bg-transparent focus:outline-none"
            />
          ) : (
            <span className="text-sm font-medium text-warm-800">
              {currentQuantity} {currentQuantity === 1 ? 'unit' : 'units'}
            </span>
          )}
        </div>
        <button
          onClick={handleIncrement}
          className={`flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-r-xl transition-colors flex-shrink-0 ${isEditMode ? 'w-7 h-7' : 'w-8 h-8'}`}
        >
          <PlusIcon size={isEditMode ? 14 : 16} />
        </button>
      </div>
    );
  };

  return (
    <div ref={cardRef}>
      <Card 
        variant="default" 
        padding="none" 
        className={`overflow-hidden ${isEditMode ? 'border-2 border-accent-400' : ''}`}
      >
        <div className="flex items-start p-4">
            {renderThumbnail()}
            
            <div className="flex-1 min-w-0 space-y-3">
              {renderHeader()}
              
              <div className="px-1 space-y-0.5">
                <p className="text-xs text-warm-400 font-mono">
                  {displayData.barcode}
                </p>
                {displayData.lastBoughtOn && (
                  <p className="text-xs text-warm-500">
                    Last bought on {displayData.lastBoughtOn}
                  </p>
                )}
              </div>
              
              <div className={`flex items-center justify-between ${isEditMode ? 'gap-2' : 'gap-3'}`}>
                {renderPrice()}
                {renderQuantityControls()}
              </div>
            </div>
          </div>
      </Card>
    </div>
  );
};

export default ProductCard;
