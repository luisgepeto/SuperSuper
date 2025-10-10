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
    <div>
      <OfflineIndicator 
        isOnline={isOnline}
        isNetworkOnline={isNetworkOnline}
        isBackendOnline={isBackendOnline}
      />
      <div className={showOfflineIndicator ? 'pt-16' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trip />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;