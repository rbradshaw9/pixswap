import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Store
import { useAuthStore } from '@/stores/auth';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import FeedPage from '@/pages/FeedPage';
import ProfilePage from '@/pages/ProfilePage';
import ChatPage from '@/pages/ChatPage';
import SwapPage from '@/pages/SwapPage';

// Components
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading, refreshUser } = useAuthStore();

  useEffect(() => {
    // Try to refresh user data on app start if token exists
    refreshUser();
  }, [refreshUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/feed" /> : <HomePage />} 
          />
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/feed" /> : <LoginPage />} 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/feed" /> : <SignupPage />} 
          />

          {/* Protected routes */}
          <Route path="/feed" element={
            <ProtectedRoute>
              <Layout>
                <FeedPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:id?" element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/swap" element={
            <ProtectedRoute>
              <Layout>
                <SwapPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Catch all redirect */}
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
