import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Save, Sparkles } from 'lucide-react';
import NavBar from '@/components/NavBar';
import ContentFilterSelector from '@/components/ContentFilterSelector';
import type { ContentFilter } from '@/types';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [contentFilter, setContentFilter] = useState<ContentFilter>('sfw');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load user's current settings
    if (user?.nsfwContentFilter) {
      setContentFilter(user.nsfwContentFilter as ContentFilter);
    }
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [isAuthenticated, navigate, user]);

  const handleFilterChange = (filter: ContentFilter) => {
    setContentFilter(filter);
    setHasChanges(true);
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setHasProfileChanges(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await api.patch('/user/profile', { displayName });
      if (response.success && response.data) {
        const data = response.data as any;
        // Update the user in the auth store
        if (user) {
          setUser({
            ...user,
            displayName: data.displayName,
          });
        }
        toast.success('Profile updated!');
        setHasProfileChanges(false);
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/user/content-filter', { contentFilter });
      
      // Refresh user data to get updated filter
      await useAuthStore.getState().refreshUser();
      
      toast.success('Content filter saved!');
      setHasChanges(false);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <NavBar variant="transparent" showBackButton backTo="/" backLabel="Back" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <SettingsIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Content Settings
          </h1>
          <p className="text-xl text-gray-300">
            Choose what type of content you want to see
          </p>
        </div>

        {/* Profile Settings Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Profile</h2>
            <p className="text-gray-300">
              Customize how your name appears to other users
            </p>
          </div>

          {/* Username (read-only) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Your username cannot be changed</p>
          </div>

          {/* Display Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Enter a display name or nickname"
              maxLength={50}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400/50 placeholder-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              This will be shown instead of your username ({displayName.length}/50 characters)
            </p>
          </div>

          {/* Save Profile Button */}
          <Button
            onClick={handleSaveProfile}
            disabled={!hasProfileChanges || savingProfile}
            className={`w-full py-3 font-semibold ${
              hasProfileChanges
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {savingProfile ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : hasProfileChanges ? (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Profile
              </>
            ) : (
              'No Changes'
            )}
          </Button>
        </div>

        {/* Content Filter Settings Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Content Filter</h2>
            <p className="text-gray-300 leading-relaxed">
              Control what content appears in your feed. This setting applies to all content you receive through swaps and the Next button.
            </p>
          </div>

          <ContentFilterSelector
            value={contentFilter}
            onChange={handleFilterChange}
            className="mb-8"
          />

          {/* Important Notice */}
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-8">
            <p className="text-yellow-200 text-sm leading-relaxed">
              <strong className="font-semibold">Note:</strong> NSFW content will always be blurred until you click to reveal it, regardless of your filter setting. This is for your safety and privacy.
            </p>
          </div>

          {/* Age Verification Notice for NSFW */}
          {(contentFilter === 'all' || contentFilter === 'nsfw') && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-8">
              <p className="text-red-200 text-sm leading-relaxed">
                <strong className="font-semibold">18+ Only:</strong> By selecting this option, you confirm that you are at least 18 years old and consent to viewing adult content.
              </p>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`w-full py-4 text-lg font-semibold ${
              hasChanges
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : hasChanges ? (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            ) : (
              'No Changes'
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>These settings are saved to your account and will apply across all your devices.</p>
        </div>
      </div>
    </div>
  );
}
