import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Image as ImageIcon, Video, Heart, MessageCircle, Eye, Trash2, Save, Clock, Sparkles, ArrowLeft, Calendar, LogOut, Edit, Flag, Shield } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import BlurredNSFWContent from '@/components/BlurredNSFWContent';

interface UploadedContent {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  uploadedAt: number;
  views: number;
  reactions: number;
  isNSFW: boolean;
  savedForever?: boolean;
  caption?: string;
  userId?: string;
  username?: string;
  liked?: boolean;
  comments?: number;
}

export default function MyUploadsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [uploads, setUploads] = useState<UploadedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState('');

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
      console.log('📂 Fetching my uploads...');
      const response = await api.get('/swap/my-uploads');
      const data = response.data as any;
      console.log('📂 My uploads response:', {
        success: response.success,
        dataType: typeof data,
        dataLength: Array.isArray(data) ? data.length : 'not an array',
        sample: Array.isArray(data) ? data.slice(0, 2) : null,
      });
      if (response.success && data) {
        setUploads(data as UploadedContent[]);
      }
    } catch (err: any) {
      console.error('📂 My uploads error:', err);
      console.error('📂 Error response:', err.response?.data);
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

  const handleUpdateCaption = async (contentId: string) => {
    try {
      await api.patch(`/swap/content/${contentId}/caption`, {
        caption: newCaption,
      });
      
      setUploads(uploads.map(u => 
        u.id === contentId ? { ...u, caption: newCaption } : u
      ));
      setEditingCaption(null);
      setNewCaption('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update caption');
    }
  };

  const handleToggleNSFW = async (contentId: string, currentNSFW: boolean) => {
    if (!confirm(`Mark this content as ${currentNSFW ? 'Safe' : 'NSFW'}?`)) return;
    
    try {
      await api.patch(`/swap/content/${contentId}/nsfw`, {
        isNSFW: !currentNSFW,
      });
      
      setUploads(uploads.map(u => 
        u.id === contentId ? { ...u, isNSFW: !currentNSFW } : u
      ));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update NSFW status');
    }
  };

  const handleLike = async (e: React.MouseEvent, contentId: string, currentlyLiked: boolean) => {
    e.stopPropagation();
    try {
      await api.post(`/swap/content/${contentId}/like`);
      setUploads(uploads.map(u => {
        if (u.id === contentId) {
          return {
            ...u,
            liked: !currentlyLiked,
            reactions: currentlyLiked ? u.reactions - 1 : u.reactions + 1
          };
        }
        return u;
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to like content');
    }
  };

  const handleCardClick = (upload: UploadedContent) => {
    const contentData = {
      id: upload.id,
      userId: upload.userId || user?._id,
      username: upload.username || user?.username,
      mediaUrl: upload.mediaUrl,
      mediaType: upload.mediaType,
      caption: upload.caption,
      isNSFW: upload.isNSFW,
      uploadedAt: upload.uploadedAt,
      views: upload.views,
      reactions: upload.reactions,
    };
    navigate(`/view?content=${encodeURIComponent(JSON.stringify(contentData))}`);
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
            {user?.displayName || user?.username}'s content • {uploads.length} upload{uploads.length !== 1 ? 's' : ''}
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
                onClick={() => handleCardClick(upload)}
                className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all group cursor-pointer"
              >
                {/* Media Preview */}
                <div className="relative aspect-square bg-black/50">
                  <BlurredNSFWContent isNSFW={upload.isNSFW}>
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
                  </BlurredNSFWContent>
                </div>

                {/* Stats & Actions */}
                <div className="p-4">
                  {/* Caption */}
                  {editingCaption === upload.id ? (
                    <div className="mb-4">
                      <textarea
                        value={newCaption}
                        onChange={(e) => setNewCaption(e.target.value)}
                        placeholder="Add a caption..."
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-purple-400/50"
                        rows={2}
                        maxLength={500}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleUpdateCaption(upload.id)}
                          className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs hover:bg-green-500/30"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCaption(null);
                            setNewCaption('');
                          }}
                          className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-lg text-xs hover:bg-gray-500/30"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 min-h-[40px]">
                      {upload.caption ? (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-300 flex-1">{upload.caption}</p>
                          <button
                            onClick={() => {
                              setEditingCaption(upload.id);
                              setNewCaption(upload.caption || '');
                            }}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingCaption(upload.id);
                            setNewCaption('');
                          }}
                          className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Add caption
                        </button>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <button
                      onClick={(e) => handleLike(e, upload.id, upload.liked || false)}
                      className={`flex items-center gap-1 transition-colors ${
                        upload.liked ? 'text-red-400' : 'text-gray-300 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${upload.liked ? 'fill-current' : ''}`} />
                      {upload.reactions}
                    </button>
                    <span className="flex items-center gap-1 text-gray-300">
                      <MessageCircle className="w-4 h-4" />
                      {upload.comments || 0}
                    </span>
                    <span className="flex items-center gap-1 text-gray-300">
                      <Eye className="w-4 h-4" />
                      {upload.views}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSave(upload.id, upload.savedForever || false);
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleNSFW(upload.id, upload.isNSFW);
                      }}
                      className={`px-3 py-2 rounded-lg transition-all ${
                        upload.isNSFW
                          ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                      title={upload.isNSFW ? 'Mark as Safe' : 'Mark as NSFW'}
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(upload.id);
                      }}
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
