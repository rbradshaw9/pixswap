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
  const { user, isAuthenticated } = useAuthStore();
  const [contentFilter, setContentFilter] = useState<ContentFilter>('sfw');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load user's current filter
    if (user?.nsfwContentFilter) {
      setContentFilter(user.nsfwContentFilter as ContentFilter);
    }
  }, [isAuthenticated, navigate, user]);

  const handleFilterChange = (filter: ContentFilter) => {
    setContentFilter(filter);
    setHasChanges(true);
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

        {/* Settings Card */}
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
