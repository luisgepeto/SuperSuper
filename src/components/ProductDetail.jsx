import { useNavigate } from 'react-router-dom';
import { Card, Badge, ChevronLeftIcon, CalendarIcon, DollarSignIcon, HashIcon, PackageIcon, ImageIcon } from './ui';

// Helper function to generate placeholder data for product details
const generatePlaceholderData = (product) => {
  // Generate random but consistent data based on product id for demo purposes
  const seed = product?.id || Date.now();
  const random = (min, max) => {
    const x = Math.sin(seed + min) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  const daysAgo = random(1, 30);
  const lastPurchaseDate = new Date();
  lastPurchaseDate.setDate(lastPurchaseDate.getDate() - daysAgo);

  return {
    quantity: random(1, 10),
    lastPurchaseDate: lastPurchaseDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    lastItemsPurchased: random(1, 5),
    lastPrice: (random(99, 1999) / 100).toFixed(2),
  };
};

const ProductDetail = ({ product, onClose }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  if (!product) {
    return null;
  }

  // Generate placeholder data for missing fields
  const placeholderData = generatePlaceholderData(product);
  
  const displayData = {
    name: product.productName || product.barcode || 'Unknown Product',
    barcode: product.barcode,
    quantity: product.quantity || `${placeholderData.quantity} units`,
    lastPurchaseDate: product.lastPurchaseDate || placeholderData.lastPurchaseDate,
    lastItemsPurchased: product.lastItemsPurchased || placeholderData.lastItemsPurchased,
    lastPrice: product.lastPrice || `$${placeholderData.lastPrice}`,
    thumbnail: product.thumbnail || null,
  };

  return (
    <div className="fixed inset-0 bg-warm-50 z-40 flex flex-col pb-20">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-warm-100 safe-area-top">
        <div className="flex items-center px-4 py-3">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-warm-100 transition-smooth"
          >
            <ChevronLeftIcon size={24} className="text-warm-600" />
          </button>
          <div className="flex-1 ml-2">
            <h1 className="font-semibold text-warm-900 truncate">
              Product Details
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* Product Details Card - Bundled thumbnail, name, barcode, and quantity */}
        <Card variant="default" padding="md" className="mb-4">
          <div className="flex items-start space-x-3">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 bg-warm-100 rounded-xl flex items-center justify-center overflow-hidden">
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
              <h2 className="text-base font-semibold text-warm-900 leading-tight">
                {displayData.name}
              </h2>
              {displayData.barcode && (
                <p className="text-xs text-warm-500 font-mono mt-0.5">
                  {displayData.barcode}
                </p>
              )}
              {/* Quantity inline */}
              <div className="flex items-center mt-2">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center mr-2">
                  <PackageIcon size={14} className="text-primary-600" />
                </div>
                <span className="text-sm font-medium text-warm-700">
                  {displayData.quantity}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Purchase History Card - Bundled all history items */}
        <Card variant="default" padding="none" className="mb-4">
          <div className="px-4 py-3 border-b border-warm-100">
            <h3 className="text-sm font-medium text-warm-600">
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
        </Card>
      </main>
    </div>
  );
};

export default ProductDetail;
