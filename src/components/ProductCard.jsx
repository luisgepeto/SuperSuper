import { useState, useRef, useEffect } from 'react';
import { Card, ImageIcon, PlusIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon, ShoppingCartIcon, TrashIcon, EditIcon, CheckIcon, CameraIcon } from './ui';
import PurchaseHistory from './PurchaseHistory';
import ImageCapture from './ImageCapture';

// Validation patterns for input fields
const PRICE_PATTERN = /^\d*\.?\d{0,2}$/;
const QUANTITY_PATTERN = /^\d+$/;

const ProductCard = ({ 
  product, 
  quantity = 1, 
  onQuantityChange, 
  onRemove, 
  onProductUpdate,
  isEditMode: externalEditMode,
  onEditModeChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [internalEditMode, setInternalEditMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editThumbnail, setEditThumbnail] = useState(null);
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

  useEffect(() => {
    let animationFrameId;
    if (isExpanded && cardRef.current) {
      animationFrameId = requestAnimationFrame(() => {
        const nextSibling = cardRef.current.nextElementSibling;
        if (nextSibling) {
          nextSibling.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isExpanded]);

  // Initialize edit fields when entering edit mode
  useEffect(() => {
    if (isEditMode && product) {
      const unitPrice = product.price;
      setEditName(product.productName || product.barcode || '');
      setEditPrice(unitPrice ? unitPrice.toFixed(2) : '0.00');
      setEditQuantity(String(quantity));
      setEditThumbnail(product.image || product.thumbnail || null);
    }
  }, [isEditMode, product, quantity]);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (isEditMode && nameInputRef.current) {
      nameInputRef.current.focus();
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
    hasPrice: product.price != null && product.price > 0,
  };

  // Calculate total price - treat null/undefined price as 0
  const effectiveUnitPrice = displayData.unitPrice || 0;
  const totalPrice = displayData.hasPrice ? (effectiveUnitPrice * quantity).toFixed(2) : null;

  const handleExpand = (e) => {
    e.stopPropagation();
    if (!isEditMode) {
      setIsExpanded(!isExpanded);
    }
  };

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
    
    const parsedPrice = parseFloat(editPrice);
    // Allow saving with price of 0 or null if user doesn't set a price
    const validPrice = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : null;
    
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

  const handleCameraCapture = (imageData) => {
    setEditThumbnail(imageData);
    setShowCamera(false);
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

  // Render edit mode UI
  if (isEditMode) {
    return (
      <div ref={cardRef}>
        <Card variant="default" padding="none" className="overflow-hidden border-2 border-accent-400">
          <div className="p-4">
            <div className="flex items-start">
              {/* Thumbnail - Clickable to change */}
              <button
                onClick={() => setShowCamera(true)}
                className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden mr-3 border-2 border-dashed border-warm-300 hover:border-accent-400 transition-colors relative group"
                aria-label="Change product image"
              >
                {editThumbnail ? (
                  <>
                    <img 
                      src={editThumbnail} 
                      alt={editName || 'Product'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CameraIcon size={20} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-warm-400">
                    <CameraIcon size={20} />
                    <span className="text-[10px] mt-0.5">Photo</span>
                  </div>
                )}
              </button>
              
              {/* Editable Fields */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Product Name Input with Action Buttons */}
                <div className="flex items-start gap-2">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Product name"
                    className="flex-1 min-w-0 px-3 py-2 text-sm font-semibold text-warm-900 bg-warm-50 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  />
                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <button
                      onClick={handleDelete}
                      className="p-1.5 text-warm-400 hover:text-error hover:bg-error-light rounded-lg transition-colors"
                      aria-label="Delete product"
                    >
                      <TrashIcon size={16} />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="p-1.5 text-accent-600 hover:text-accent-700 hover:bg-accent-50 rounded-lg transition-colors"
                      aria-label="Save changes"
                    >
                      <CheckIcon size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Barcode - Read only */}
                <p className="text-xs text-warm-400 font-mono px-1">
                  {displayData.barcode}
                </p>
                
                {/* Price and Quantity Row */}
                <div className="flex items-center justify-between gap-3">
                  {/* Price Input */}
                  <div className="flex items-center">
                    <span className="text-base font-bold text-primary-700 mr-1">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || PRICE_PATTERN.test(value)) {
                          setEditPrice(value);
                        }
                      }}
                      className="w-20 px-2 py-1.5 text-base font-bold text-primary-700 bg-warm-50 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center bg-warm-50 rounded-xl border border-warm-200">
                    <button
                      onClick={handleDecrement}
                      className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-l-xl transition-colors"
                    >
                      <MinusIcon size={16} />
                    </button>
                    <div className="flex items-center justify-center">
                      <ShoppingCartIcon size={14} className="text-primary-600 mr-1" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editQuantity}
                        onChange={handleQuantityInputChange}
                        onBlur={handleQuantityInputBlur}
                        className="w-8 text-center text-sm font-medium text-warm-800 bg-transparent focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleIncrement}
                      className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-r-xl transition-colors"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Camera Popup */}
          {showCamera && (
            <ImageCapture
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
            />
          )}
        </Card>
      </div>
    );
  }

  // Render normal view mode UI
  return (
    <div ref={cardRef}>
      <Card variant="default" padding="none" className="overflow-hidden">
        {/* Main Product Row - Clickable to expand */}
        <div 
          className="cursor-pointer"
          onClick={handleExpand}
        >
          <div className="flex items-start p-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden mr-3">
              {displayData.thumbnail ? (
                <img 
                  src={displayData.thumbnail} 
                  alt={displayData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon size={28} className="text-warm-400" />
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-warm-900 leading-tight line-clamp-2 flex-1 mr-2">
                  {displayData.name}
                </h3>
                {/* Edit and Expand Controls */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  <button
                    onClick={handleEnterEditMode}
                    className="p-1 text-warm-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                    aria-label="Edit product"
                  >
                    <EditIcon size={16} />
                  </button>
                  <div className="text-warm-400">
                    {isExpanded ? (
                      <ChevronUpIcon size={18} />
                    ) : (
                      <ChevronDownIcon size={18} />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-warm-400 font-mono mt-0.5">
                {displayData.barcode}
              </p>
              
              {/* Price and Quantity Controls - Same Row */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-base font-bold text-primary-700">
                  {totalPrice !== null ? `$${totalPrice}` : '-'}
                </p>
                
                {/* Quantity Controls */}
                <div className="flex items-center bg-warm-50 rounded-xl border border-warm-100">
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
                  <div className="flex items-center justify-center px-2">
                    <ShoppingCartIcon size={14} className="text-primary-600 mr-1.5" />
                    <span className="text-sm font-medium text-warm-800">
                      {quantity} {quantity === 1 ? 'unit' : 'units'}
                    </span>
                  </div>
                  <button
                    onClick={handleIncrement}
                    className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-r-xl transition-colors"
                  >
                    <PlusIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Purchase History Section */}
        {isExpanded && (
          <PurchaseHistory product={product} />
        )}
      </Card>
    </div>
  );
};

export default ProductCard;
