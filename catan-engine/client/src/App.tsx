import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import HordeRules from './pages/HordeRules';
import AllianceRules from './pages/AllianceRules';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Game />} />
        <Route path="/rules/horde" element={<HordeRules />} />
        <Route path="/rules/alliance" element={<AllianceRules />} />
      </Routes>
    </Router>
  );
}

export default App;
