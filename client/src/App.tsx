import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Store
import { useAuthStore } from '@/stores/auth';

// Pages
import SwapPage from '@/pages/SwapPage';
import SwapViewPage from '@/pages/SwapViewPage';
import SwapChatPage from '@/pages/SwapChatPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import MyUploadsPage from '@/pages/MyUploadsPage';

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
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Main app routes */}
          <Route path="/" element={<SwapPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/view" element={<SwapViewPage />} />
          <Route path="/my-uploads" element={<MyUploadsPage />} />
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
