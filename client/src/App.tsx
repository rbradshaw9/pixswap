import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Store
import { useAuthStore } from '@/stores/auth';

// Pages
import SwapPage from '@/pages/SwapPage';
import SwapChatPage from '@/pages/SwapChatPage';

// Components
import LoadingSpinner from '@/components/LoadingSpinner';

function App() {
  const { isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* All routes go to swap */}
          <Route path="/" element={<SwapPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/swap/:swapId" element={<SwapChatPage />} />
          
          {/* Catch all redirect to swap */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
