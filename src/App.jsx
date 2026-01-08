import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Trip from './pages/Trip';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import ConnectionBanner from './components/ConnectionBanner';

const App = () => {
  return (
    <div className="h-screen overflow-hidden fixed inset-0 w-full bg-warm-50">
      <ConnectionBanner />
      <div className="h-full overflow-hidden pb-16">
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