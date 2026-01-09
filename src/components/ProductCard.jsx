import { useState, useRef, useEffect } from 'react';
import { Card, ImageIcon, PlusIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon, ShoppingCartIcon } from './ui';
import PurchaseHistory from './PurchaseHistory';
import { generatePlaceholderPrice } from '../utils/placeholderData';

const ProductCard = ({ product, quantity = 1, onQuantityChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    if (isExpanded && cardRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated before scrolling
      animationFrameId = requestAnimationFrame(() => {
        // Find the next sibling element after this card
        const nextSibling = cardRef.current.nextElementSibling;
        if (nextSibling) {
          // Scroll the next sibling into view to keep it visible
          nextSibling.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          // If there's no next sibling, scroll the card itself into view
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

  if (!product) {
    return null;
  }

  const displayData = {
    name: product.productName || product.barcode || 'Unknown Product',
    barcode: product.barcode,
    thumbnail: product.image || product.thumbnail || null,
    unitPrice: product.price || generatePlaceholderPrice(product),
  };

  const totalPrice = (displayData.unitPrice * quantity).toFixed(2);

  const handleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (onQuantityChange) {
      onQuantityChange(product.id, quantity + 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (onQuantityChange && quantity > 1) {
      onQuantityChange(product.id, quantity - 1);
    }
  };

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
                {/* Expand/Collapse Indicator */}
                <div className="flex-shrink-0 text-warm-400">
                  {isExpanded ? (
                    <ChevronUpIcon size={18} />
                  ) : (
                    <ChevronDownIcon size={18} />
                  )}
                </div>
              </div>
              <p className="text-xs text-warm-400 font-mono mt-0.5">
                {displayData.barcode}
              </p>
              
              {/* Price and Quantity Controls - Same Row */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-base font-bold text-primary-700">
                  ${totalPrice}
                </p>
                
                {/* Quantity Controls */}
                <div className="flex items-center bg-warm-50 rounded-xl border border-warm-100">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-l-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <MinusIcon size={16} />
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
