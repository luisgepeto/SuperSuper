import { Card, ShoppingCartIcon } from './ui';

const PantryItem = ({ item }) => {
  if (!item) {
    return null;
  }

  const displayData = {
    name: item.productName || item.productId || 'Unknown Product',
    productId: item.productId,
    quantity: item.quantity || 0
  };

  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="flex items-center p-4">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-warm-900 leading-tight line-clamp-2">
            {displayData.name}
          </h3>
          <p className="text-xs text-warm-400 font-mono mt-1" aria-label={`Barcode: ${displayData.productId}`}>
            {displayData.productId}
          </p>
        </div>

        {/* Quantity Display */}
        <div className="flex items-center bg-warm-50 rounded-xl border border-warm-100 px-3 py-2 flex-shrink-0 ml-3">
          <ShoppingCartIcon size={14} className="text-primary-600 mr-1.5" />
          <span className="text-sm font-medium text-warm-800">
            {displayData.quantity} {displayData.quantity === 1 ? 'unit' : 'units'}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default PantryItem;
