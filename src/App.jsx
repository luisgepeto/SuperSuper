import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Trip from './pages/Trip';
import Settings from './pages/Settings';
import StatusBar from './components/StatusBar';

const App = () => {
  return (
    <div className="h-screen overflow-hidden fixed inset-0 w-full">
      <div className="h-full overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trip />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <StatusBar />
    </div>
  );
};

export default App;