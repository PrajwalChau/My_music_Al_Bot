import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Navbar from './components/Navbar.jsx';
import LandingPage from './components/LandingPage.jsx';
import ResultPage from './components/ResultPage.jsx';
import ParticleBackground from './components/ParticleBackground.jsx';

function App() {
  return (
    <AppProvider>
      <div className="relative min-h-screen bg-himalaya-900 overflow-x-hidden">
        <ParticleBackground />
        <Navbar />
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
