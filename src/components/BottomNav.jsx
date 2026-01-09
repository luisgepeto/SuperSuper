import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, SettingsIcon, ShoppingCartIcon } from './ui/Icons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import tripStorage from '../services/tripStorage';
import generateGUID from '../utils/guid';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  
  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
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
    const activeTrip = tripStorage.getActiveTrip();
    
    if (activeTrip) {
      // Navigate to the active trip
      navigate(`/trips?tripId=${activeTrip.tripId}`);
    } else {
      // Create a new trip
      const tripId = generateGUID();
      navigate(`/trips?tripId=${tripId}`);
    }
  };

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
