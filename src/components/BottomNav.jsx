import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, SettingsIcon, ShoppingCartIcon } from './ui/Icons';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/trips', icon: ShoppingCartIcon, label: 'Trip' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const isActive = (item) => {
    if (item.path === '/trips') {
      return location.pathname.startsWith('/trips');
    }
    return location.pathname === item.path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-200 shadow-nav z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          
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
              <div className={`p-1.5 rounded-xl transition-smooth ${
                active ? 'bg-primary-50' : ''
              }`}>
                <Icon size={22} className={active ? 'stroke-[2.5]' : ''} />
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
