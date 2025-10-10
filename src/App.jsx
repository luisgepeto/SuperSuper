import { Routes, Route } from 'react-router-dom';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import OfflineIndicator from './components/OfflineIndicator';
import Home from './pages/Home';
import Trip from './pages/Trip';

const App = () => {
  const {
    isOnline,
    isNetworkOnline,
    isBackendOnline
  } = useOnlineStatus();

  // Add top padding when offline indicator is showing
  const showOfflineIndicator = !isOnline;

  return (
    <div className="h-screen overflow-hidden fixed inset-0 w-full">
      <OfflineIndicator 
        isOnline={isOnline}
        isNetworkOnline={isNetworkOnline}
        isBackendOnline={isBackendOnline}
      />
      <div className={showOfflineIndicator ? 'pt-16 h-full overflow-hidden' : 'h-full overflow-hidden'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trip />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;