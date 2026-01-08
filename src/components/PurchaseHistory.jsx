import { Badge, CalendarIcon, DollarSignIcon, HashIcon } from './ui';
import { generatePlaceholderPurchaseData } from '../utils/placeholderData';

const PurchaseHistory = ({ product }) => {
  if (!product) {
    return null;
  }

  const placeholderData = generatePlaceholderPurchaseData(product);

  const displayData = {
    lastPurchaseDate: product.lastPurchaseDate || placeholderData.lastPurchaseDate,
    lastItemsPurchased: product.lastItemsPurchased || placeholderData.lastItemsPurchased,
    lastPrice: product.lastPrice || `$${placeholderData.lastPrice}`,
  };

  return (
    <div className="border-t border-warm-100">
      <div className="px-4 py-3 border-b border-warm-100">
        <h3 className="text-sm font-medium text-accent-600">
          Purchase History
        </h3>
      </div>
      
      {/* Last Purchase Date */}
      <div className="flex items-center px-4 py-3 border-b border-warm-50">
        <div className="flex-shrink-0 w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center mr-3">
          <CalendarIcon size={16} className="text-accent-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-warm-500">Last Purchased</p>
          <p className="text-sm font-semibold text-warm-900">
            {displayData.lastPurchaseDate}
          </p>
        </div>
        <Badge variant="default" size="sm">
          Recent
        </Badge>
      </div>

      {/* Last Items Purchased */}
      <div className="flex items-center px-4 py-3 border-b border-warm-50">
        <div className="flex-shrink-0 w-8 h-8 bg-warm-100 rounded-lg flex items-center justify-center mr-3">
          <HashIcon size={16} className="text-warm-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-warm-500">Last Purchase Amount</p>
          <p className="text-sm font-semibold text-warm-900">
            {displayData.lastItemsPurchased} {displayData.lastItemsPurchased === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {/* Last Price */}
      <div className="flex items-center px-4 py-3">
        <div className="flex-shrink-0 w-8 h-8 bg-success-light rounded-lg flex items-center justify-center mr-3">
          <DollarSignIcon size={16} className="text-success-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-warm-500">Last Price Paid</p>
          <p className="text-sm font-semibold text-warm-900">
            {displayData.lastPrice}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistory;
