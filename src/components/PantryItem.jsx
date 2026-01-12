import { useState, useRef, useEffect } from 'react';
import { Card, PlusIcon, MinusIcon, PackageIcon, TrashIcon, EditIcon, CheckIcon, CameraIcon } from './ui';

const QUANTITY_PATTERN = /^\d+$/;

const PantryItem = ({ 
  item, 
  onRemove,
  onItemUpdate,
  isEditMode: externalEditMode,
  onEditModeChange,
  onImageCaptureRequest
}) => {
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editImage, setEditImage] = useState(null);
  const cardRef = useRef(null);
  const nameInputRef = useRef(null);

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
    if (isEditMode && item) {
      setEditName(item.productName || item.productId || '');
      setEditQuantity(String(item.quantity || 1));
      setEditImage(item.image || null);
    }
  }, [isEditMode, item]);

  // Scroll card to top and focus name input when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      const rafId = requestAnimationFrame(() => {
        if (cardRef.current) {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          cardRef.current.scrollIntoView({ 
            behavior: prefersReducedMotion ? 'instant' : 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
        
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          if (nameInputRef.current.value) {
            nameInputRef.current.select();
          }
        }
      });
      
      return () => {
        cancelAnimationFrame(rafId);
      };
    }
  }, [isEditMode]);

  if (!item) {
    return null;
  }

  const displayData = {
    name: item.productName || item.productId || 'Unknown Product',
    productId: item.productId,
    quantity: item.quantity || 0,
    image: item.image || null
  };

  const currentImage = isEditMode ? editImage : displayData.image;
  const currentName = isEditMode ? editName : displayData.name;
  const currentQuantity = isEditMode ? (parseInt(editQuantity, 10) || 1) : displayData.quantity;

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (isEditMode) {
      const newQty = parseInt(editQuantity, 10) || 0;
      setEditQuantity(String(newQty + 1));
    } else {
      // In display mode, immediately update the item
      const newQty = (item.quantity || 0) + 1;
      if (onItemUpdate) {
        onItemUpdate(item.productId, { quantity: newQty });
      }
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
      // In display mode, if quantity is 1, delete the item
      if (item.quantity === 1) {
        if (onRemove) {
          onRemove(item.productId);
        }
      } else if (onItemUpdate) {
        // Otherwise, decrement the quantity
        const newQty = (item.quantity || 0) - 1;
        onItemUpdate(item.productId, { quantity: newQty });
      }
    }
  };

  const handleEnterEditMode = (e) => {
    e.stopPropagation();
    setEditMode(true);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    
    const newQuantity = Math.max(1, parseInt(editQuantity, 10) || 1);
    
    const updates = {
      productName: editName.trim() || item.productId,
      quantity: newQuantity,
      image: editImage
    };

    if (onItemUpdate) {
      onItemUpdate(item.productId, updates);
    }

    setEditMode(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(item.productId);
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
    const qty = parseInt(editQuantity, 10);
    if (!qty || qty < 1) {
      setEditQuantity('1');
    }
  };

  // Thumbnail component
  const renderThumbnail = () => {
    if (!currentImage) {
      if (isEditMode) {
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
      // No image and not in edit mode - show package icon
      return (
        <div className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden mr-3">
          <PackageIcon size={24} className="text-warm-400" />
        </div>
      );
    }

    // If in edit mode and image exists, show editable overlay
    if (isEditMode) {
      return (
        <button
          onClick={handleOpenCamera}
          className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden mr-3 border-2 border-warm-200 hover:border-accent-400 transition-colors relative group"
          aria-label="Change product image"
        >
          <img 
            src={currentImage} 
            alt={currentName || 'Product'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <CameraIcon size={20} className="text-white" />
          </div>
        </button>
      );
    }

    // Normal display mode with image
    return (
      <div className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden mr-3">
        <img 
          src={currentImage} 
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
            aria-label="Edit item"
          >
            <EditIcon size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Quantity controls
  const renderQuantityControls = () => {
    const borderClass = isEditMode ? 'border-warm-200' : 'border-warm-100';
    
    // Calculate package icon spacing based on mode and quantity
    // When quantity is 1 or in edit mode, trash icon appears on the left,
    // so we add extra left margin for visual balance
    let packageIconClass = 'text-primary-600';
    if ((!isEditMode && currentQuantity === 1) || isEditMode) {
      packageIconClass += ' ml-1.5 mr-1';
    } else {
      packageIconClass += ' mr-1.5';
    }
    
    return (
      <div className={`flex items-center bg-warm-50 rounded-xl border flex-shrink-0 ${borderClass}`}>
        {isEditMode ? (
          <button
            onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-l-xl transition-colors flex-shrink-0"
            aria-label="Delete item"
          >
            <TrashIcon size={14} />
          </button>
        ) : (
          <button
            onClick={handleDecrement}
            className="w-7 h-7 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-l-xl transition-colors flex-shrink-0"
            aria-label={currentQuantity === 1 ? "Delete item" : "Decrease quantity"}
          >
            {currentQuantity === 1 ? (
              <TrashIcon size={14} />
            ) : (
              <MinusIcon size={14} />
            )}
          </button>
        )}
        {isEditMode && currentQuantity > 1 && (
          <button
            onClick={handleDecrement}
            className="w-7 h-7 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-colors flex-shrink-0"
            aria-label="Decrease quantity"
          >
            <MinusIcon size={14} />
          </button>
        )}
        <div className={`flex items-center justify-center ${isEditMode ? '' : 'px-2'}`}>
          <PackageIcon size={12} className={packageIconClass} />
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
              {currentQuantity}
            </span>
          )}
        </div>
        <button
          onClick={handleIncrement}
          className="w-7 h-7 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-r-xl transition-colors flex-shrink-0"
          aria-label="Increase quantity"
        >
          <PlusIcon size={14} />
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
            
            <p className="text-xs text-warm-400 font-mono px-1" aria-label={`Barcode: ${displayData.productId}`}>
              {displayData.productId}
            </p>
            
            <div className="flex items-center justify-end">
              {renderQuantityControls()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PantryItem;
