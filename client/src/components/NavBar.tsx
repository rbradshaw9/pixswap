import { Link, useNavigate } from 'react-router-dom';
import { Home, Upload, FolderOpen, Users, LogOut, Shield, Sparkles, Heart, Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import NotificationBell from './NotificationBell';

interface NavBarProps {
  variant?: 'default' | 'transparent';
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
}

export default function NavBar({ 
  variant = 'default', 
  showBackButton = false,
  backTo = '/',
  backLabel = 'Back'
}: NavBarProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const baseClasses = variant === 'transparent' 
    ? 'border-b border-white/10 bg-black/20 backdrop-blur-xl'
    : 'border-b border-gray-200 bg-white shadow-sm';

  const textClasses = variant === 'transparent'
    ? 'text-gray-300 hover:text-white'
    : 'text-gray-700 hover:text-gray-900';

  const buttonClasses = variant === 'transparent'
    ? 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-700';

  const logoClasses = variant === 'transparent'
    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
    : 'bg-gradient-to-br from-primary-600 to-purple-600';

  const logoTextClasses = variant === 'transparent'
    ? 'bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent'
    : 'text-gray-900';

  return (
    <nav className={baseClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Back button or Logo */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={() => navigate(backTo)}
                className={`flex items-center gap-2 ${textClasses} transition-colors`}
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl ${logoClasses} flex items-center justify-center shadow-lg`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <Link to="/" className={`text-2xl font-bold ${logoTextClasses}`}>
                  PixSwap
                </Link>
              </>
            )}
          </div>

          {/* Center - Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 ${textClasses} transition-colors`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/my-uploads"
                  className={`flex items-center gap-2 ${textClasses} transition-colors`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>My Uploads</span>
                </Link>
                <Link
                  to="/liked-posts"
                  className={`flex items-center gap-2 ${textClasses} transition-colors`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Liked</span>
                </Link>
                <Link
                  to="/settings"
                  className={`flex items-center gap-2 ${textClasses} transition-colors`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 ${textClasses} transition-colors`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />
                
                <Link 
                  to={`/profile/${user?.username}`}
                  className={`hidden sm:flex items-center gap-2 ${textClasses} hover:underline transition-colors`}
                >
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{user?.displayName || user?.username}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${buttonClasses} transition-all`}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-xl ${buttonClasses} transition-all`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden flex items-center gap-4 pb-3 border-t border-white/10 pt-3 mt-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${buttonClasses} transition-all text-sm`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            <Link
              to="/my-uploads"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${buttonClasses} transition-all text-sm`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>My Uploads</span>
            </Link>
            <Link
              to="/liked-posts"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${buttonClasses} transition-all text-sm`}
            >
              <Heart className="w-4 h-4" />
              <span>Liked</span>
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${buttonClasses} transition-all text-sm`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            {user?.isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${buttonClasses} transition-all text-sm`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
