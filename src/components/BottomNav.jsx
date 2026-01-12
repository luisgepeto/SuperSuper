import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, SettingsIcon, ShoppingCartIcon } from './ui/Icons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import tripStorage, { TRIPS_STORAGE_KEY } from '../services/tripStorage';
import generateGUID from '../utils/guid';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const [activeTrip, setActiveTrip] = useState(null);
  
  // Function to check and update active trip state
  const checkActiveTrip = useCallback(() => {
    const trip = tripStorage.getActiveTrip();
    setActiveTrip(trip);
  }, []);
  
  // Check for active trip on mount and when location changes
  useEffect(() => {
    checkActiveTrip();
  }, [location, checkActiveTrip]);
  
  // Listen for storage changes to detect trip creation/updates from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === TRIPS_STORAGE_KEY || e.key === null) {
        checkActiveTrip();
      }
    };
    
    // Listen for custom event dispatched when trip is created/updated
    const handleTripUpdate = () => {
      checkActiveTrip();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tripUpdated', handleTripUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tripUpdated', handleTripUpdate);
    };
  }, [checkActiveTrip]);

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Pantry' },
    { path: '/trips', icon: ShoppingCartIcon, label: 'Trip' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', showWarning: !isOnline },
  ];

  const isActive = (item) => {
    if (item.path === '/trips') {
      return location.pathname.startsWith('/trips');
    }
    return location.pathname === item.path;
  };

  const handleTripClick = (e) => {
    e.preventDefault();
    const currentActiveTrip = tripStorage.getActiveTrip();
    
    if (currentActiveTrip) {
      // Navigate to the active trip
      navigate(`/trips?tripId=${currentActiveTrip.tripId}`);
    } else {
      // Create a new trip
      const tripId = generateGUID();
      navigate(`/trips?tripId=${tripId}`);
    }
  };

  // Determine trip button state
  const hasActiveTrip = !!activeTrip;
  const tripItemCount = activeTrip?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-200 shadow-nav z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          const isTripItem = item.path === '/trips';
          
          if (isTripItem) {
            return (
              <button
                key={item.path}
                onClick={handleTripClick}
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-smooth ${
                  active 
                    ? 'text-primary-600' 
                    : hasActiveTrip
                      ? 'text-accent-600 hover:text-accent-700'
                      : 'text-warm-400 hover:text-warm-600'
                }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-smooth ${
                  active 
                    ? 'bg-primary-50' 
                    : hasActiveTrip 
                      ? 'bg-accent-50' 
                      : ''
                }`}>
                  {/* Always use ShoppingCartIcon for trip button */}
                  <ShoppingCartIcon size={22} className={active ? 'stroke-[2.5]' : ''} />
                  {/* Show item count badge when there's an active trip */}
                  {hasActiveTrip && tripItemCount > 0 && !active && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {tripItemCount > 99 ? '99+' : tripItemCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-0.5 font-medium ${
                  active 
                    ? 'text-primary-600' 
                    : hasActiveTrip 
                      ? 'text-accent-600' 
                      : 'text-warm-500'
                }`}>
                  {hasActiveTrip ? 'Continue' : 'New Trip'}
                </span>
              </button>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-smooth ${
                active 
                  ? 'text-primary-600' 
                  : 'text-warm-400 hover:text-warm-600'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-smooth ${
                active ? 'bg-primary-50' : ''
              }`}>
                <Icon size={22} className={active ? 'stroke-[2.5]' : ''} />
                {item.showWarning && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </div>
              <span className={`text-xs mt-0.5 font-medium ${
                active ? 'text-primary-600' : 'text-warm-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
