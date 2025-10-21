import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Image as ImageIcon, Video, Heart, MessageCircle, Eye, Trash2, Save, Clock, Sparkles, ArrowLeft, Calendar, LogOut } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface UploadedContent {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  uploadedAt: number;
  views: number;
  reactions: number;
  isNSFW: boolean;
  savedForever?: boolean;
}

export default function MyUploadsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [uploads, setUploads] = useState<UploadedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyUploads();
  }, [navigate, isAuthenticated]);

  const fetchMyUploads = async () => {
    setLoading(true);
    try {
      const response = await api.get('/swap/my-uploads');
      if (response.success && response.data) {
        setUploads(response.data as UploadedContent[]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await api.delete(`/swap/content/${contentId}`);
      setUploads(uploads.filter(u => u.id !== contentId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete content');
    }
  };

  const handleToggleSave = async (contentId: string, currentlySaved: boolean) => {
    try {
      await api.post(`/swap/content/${contentId}/save`, {
        saveForever: !currentlySaved,
      });
      
      setUploads(uploads.map(u => 
        u.id === contentId ? { ...u, savedForever: !currentlySaved } : u
      ));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update save status');
    }
  };

  const getTimeRemaining = (uploadedAt: number, savedForever?: boolean) => {
    if (savedForever) return 'Saved forever';
    
    const now = Date.now();
    const expiresAt = uploadedAt + (24 * 60 * 60 * 1000); // 24 hours
    const remaining = expiresAt - now;
    
    if (remaining < 0) return 'Expired';
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Loading your uploads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <NavBar variant="transparent" showBackButton backTo="/" backLabel="Back to Swap" />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            My Uploads
          </h1>
          <p className="text-gray-400">
            {user?.username}'s content • {uploads.length} upload{uploads.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 mb-6">
            {error}
          </div>
        )}

        {uploads.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No uploads yet</h3>
            <p className="text-gray-400 mb-6">Start swapping to see your content here!</p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Upload Your First Photo
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all group"
              >
                {/* Media Preview */}
                <div className="relative aspect-square bg-black/50">
                  {upload.mediaType === 'video' ? (
                    <video
                      src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${upload.mediaUrl}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={upload.mediaUrl.startsWith('http') ? upload.mediaUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${upload.mediaUrl}`}
                      alt="Upload"
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Media Type Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm flex items-center gap-2">
                      {upload.mediaType === 'video' ? (
                        <Video className="w-4 h-4 text-purple-400" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                      )}
                      <span className="text-xs text-white uppercase">{upload.mediaType}</span>
                    </div>
                  </div>

                  {/* NSFW Badge */}
                  {upload.isNSFW && (
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1 rounded-lg bg-red-500/80 backdrop-blur-sm">
                        <span className="text-xs text-white font-semibold">NSFW</span>
                      </div>
                    </div>
                  )}

                  {/* Saved Forever Badge */}
                  {upload.savedForever && (
                    <div className="absolute bottom-3 left-3">
                      <div className="px-3 py-1 rounded-lg bg-green-500/80 backdrop-blur-sm flex items-center gap-2">
                        <Save className="w-3 h-3 text-white" />
                        <span className="text-xs text-white font-semibold">Saved</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats & Actions */}
                <div className="p-4">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {upload.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {upload.reactions}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      0
                    </span>
                  </div>

                  {/* Time Remaining */}
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeRemaining(upload.uploadedAt, upload.savedForever)}</span>
                  </div>

                  {/* Upload Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(upload.uploadedAt).toLocaleDateString()} at {new Date(upload.uploadedAt).toLocaleTimeString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSave(upload.id, upload.savedForever || false)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        upload.savedForever
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {upload.savedForever ? 'Saved' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
