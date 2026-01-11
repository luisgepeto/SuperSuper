import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tripStorage from '../services/tripStorage';
import { navigateToTrip } from '../utils/navigation';
import { Button, Card, Badge, ShoppingCartIcon, PlusIcon, ChevronRightIcon } from '../components/ui';

const Home = () => {
  const navigate = useNavigate();
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    const trip = tripStorage.getActiveTrip();
    setActiveTrip(trip);
  }, []);

  const handleGoShopping = () => {
    navigateToTrip(navigate);
  };

  const handleContinueShopping = () => {
    navigateToTrip(navigate);
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

          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;