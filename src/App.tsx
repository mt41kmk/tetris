import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';

// レイジーローディングでコンポーネントをインポート
const StartScreen = lazy(() => import('./pages/Start'));
const GameScreen = lazy(() => import('./pages/Game'));
const ResultScreen = lazy(() => import('./pages/Result'));

// ローディングコンポーネント
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-2xl font-bold">Loading...</div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Toaster position="top-center" />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<StartScreen />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="/result" element={<ResultScreen />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
