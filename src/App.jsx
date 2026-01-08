import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Trip from './pages/Trip';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import ConnectionBanner from './components/ConnectionBanner';

const App = () => {
  return (
    <div className="h-screen overflow-hidden fixed inset-0 w-full bg-warm-50 flex flex-col">
      <ConnectionBanner />
      <div className="flex-1 overflow-hidden pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trip />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
};

export default App;