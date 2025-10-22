import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Store
import { useAuthStore } from '@/stores/auth';

// Context
import { NotificationProvider } from '@/context/NotificationContext';

// Pages
import SwapPage from '@/pages/SwapPage';
import SwapViewPage from '@/pages/SwapViewPage';
import SwapChatPage from '@/pages/SwapChatPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import MyUploadsPage from '@/pages/MyUploadsPage';
import LikedPostsPage from '@/pages/LikedPostsPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import ProfilePage from '@/pages/ProfilePage';
import FriendsPage from '@/pages/FriendsPage';
import MessagesPage from '@/pages/MessagesPage';

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
      <NotificationProvider>
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
            <Route path="/liked-posts" element={<LikedPostsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:username" element={<MessagesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/swap/:swapId" element={<SwapChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
            
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
      </NotificationProvider>
    </Router>
  );
}

export default App;
