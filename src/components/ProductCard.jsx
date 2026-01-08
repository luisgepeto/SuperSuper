import { useState } from 'react';
import { Card, ImageIcon, PlusIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon, ShoppingCartIcon } from './ui';
import PurchaseHistory from './PurchaseHistory';
import { generatePlaceholderPrice } from '../utils/placeholderData';

const ProductCard = ({ product, quantity = 1, onQuantityChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
            <h3 className="text-sm font-semibold text-warm-900 leading-tight line-clamp-2">
              {displayData.name}
            </h3>
            <p className="text-xs text-warm-400 font-mono mt-0.5">
              {displayData.barcode}
            </p>
            
            {/* Price */}
            <div className="mt-2 flex items-center justify-between">
              <p className="text-base font-bold text-primary-700">
                ${totalPrice}
              </p>
              
              {/* Expand/Collapse Indicator */}
              <div className="flex items-center text-warm-400">
                {isExpanded ? (
                  <ChevronUpIcon size={18} />
                ) : (
                  <ChevronDownIcon size={18} />
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Quantity Controls */}
        <div className="px-4 pb-4 flex items-center justify-end">
          <div className="flex items-center bg-warm-50 rounded-xl border border-warm-100">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-l-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <MinusIcon size={18} />
            </button>
            <div className="flex items-center justify-center px-3 min-w-[80px]">
              <ShoppingCartIcon size={16} className="text-primary-600 mr-2" />
              <span className="text-sm font-medium text-warm-800">
                {quantity} {quantity === 1 ? 'unit' : 'units'}
              </span>
            </div>
            <button
              onClick={handleIncrement}
              className="w-10 h-10 flex items-center justify-center text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-r-xl transition-colors"
            >
              <PlusIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Purchase History Section */}
      {isExpanded && (
        <PurchaseHistory product={product} />
      )}
    </Card>
  );
};

export default ProductCard;
