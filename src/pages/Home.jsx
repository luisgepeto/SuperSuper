import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tripStorage from '../services/tripStorage';
import { Button, Card, Badge, EmptyState, ShoppingCartIcon, PlusIcon, ChevronRightIcon, CalendarIcon } from '../components/ui';

const Home = () => {
  const navigate = useNavigate();
  const [activeTrips, setActiveTrips] = useState([]);

  useEffect(() => {
    const trips = tripStorage.getActiveTrips();
    setActiveTrips(trips);
  }, []);

  const generateGUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleGoShopping = () => {
    const tripId = generateGUID();
    navigate(`/trips?tripId=${tripId}`);
  };

  const handleResumeTrip = (tripId) => {
    navigate(`/trips?tripId=${tripId}`);
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const hasActiveTrips = activeTrips.length > 0;

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
            
            {/* Quick Action Card */}
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

            {/* Active Trips Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-semibold text-warm-800">
                  Active Trips
                </h2>
                {hasActiveTrips && (
                  <Badge variant="primary" size="sm">
                    {activeTrips.length}
                  </Badge>
                )}
              </div>

              {!hasActiveTrips ? (
                <Card variant="default" padding="lg">
                  <EmptyState
                    icon={<ClipboardListIcon size={40} />}
                    title="No active trips"
                    description="Start a new shopping trip to begin scanning products"
                  />
                </Card>
              ) : (
                <div className="space-y-3">
                  {activeTrips.map((trip) => (
                    <Card
                      key={trip.tripId}
                      variant="default"
                      padding="none"
                      hover
                      onClick={() => handleResumeTrip(trip.tripId)}
                      className="active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center p-4">
                        <div className="flex-shrink-0 p-2.5 bg-primary-50 rounded-xl mr-4">
                          <ShoppingCartIcon size={20} className="text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-warm-900 truncate">
                            {trip.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default" size="sm">
                              {trip.items?.length || 0} items
                            </Badge>
                            <span className="text-xs text-warm-400">
                              {formatRelativeDate(trip.createdAt)}
                            </span>
                          </div>
                        </div>
                        <ChevronRightIcon size={20} className="text-warm-300 flex-shrink-0" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Local icon component for clipboard list
const ClipboardListIcon = ({ size = 24, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </svg>
);

export default Home;