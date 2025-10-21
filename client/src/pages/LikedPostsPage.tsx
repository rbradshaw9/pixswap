import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Image as ImageIcon, Video, Eye, MessageCircle, Sparkles, Calendar } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import ProtectedMedia from '@/components/ProtectedMedia';
import BlurredNSFWContent from '@/components/BlurredNSFWContent';

interface LikedContent {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  username: string;
  uploadedAt: number;
  views: number;
  isNSFW: boolean;
  likedAt: number;
  comments: number;
  reactions: number;
  userId?: string;
  caption?: string;
}

export default function LikedPostsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [likedPosts, setLikedPosts] = useState<LikedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchLikedPosts();
  }, [navigate, isAuthenticated]);

  const fetchLikedPosts = async () => {
    setLoading(true);
    try {
      console.log('❤️ Fetching liked posts...');
      const response = await api.get('/swap/liked-posts');
      console.log('❤️ Liked posts response:', {
        success: response.success,
        dataType: typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'not an array',
        sample: Array.isArray(response.data) ? response.data.slice(0, 2) : null,
      });
      if (response.success && response.data) {
        setLikedPosts(response.data as LikedContent[]);
      }
    } catch (err: any) {
      console.error('❤️ Liked posts error:', err);
      console.error('❤️ Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load liked posts');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (e: React.MouseEvent, contentId: string) => {
    e.stopPropagation();
    try {
      await api.post(`/swap/content/${contentId}/like`);
      setLikedPosts(likedPosts.filter(p => p.id !== contentId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlike content');
    }
  };

  const handleViewContent = (content: LikedContent) => {
    const contentData = encodeURIComponent(JSON.stringify(content));
    navigate(`/view?content=${contentData}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Loading liked posts...</p>
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
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-10 h-10 text-pink-400 fill-pink-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Liked Posts
            </h1>
          </div>
          <p className="text-gray-400">
            Content you've liked • {likedPosts.length} post{likedPosts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 mb-6">
            {error}
          </div>
        )}

        {likedPosts.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No liked posts yet</h3>
            <p className="text-gray-400 mb-6">Start liking content to see it here!</p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start Swapping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handleViewContent(post)}
                className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all cursor-pointer group"
              >
                {/* Media Preview */}
                <div className="relative aspect-square bg-black/50">
                  <BlurredNSFWContent isNSFW={post.isNSFW}>
                    <ProtectedMedia
                      mediaUrl={post.mediaUrl.startsWith('http') ? post.mediaUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${post.mediaUrl}`}
                      mediaType={post.mediaType}
                      username={post.username}
                      className="w-full h-full object-cover"
                    />
                  </BlurredNSFWContent>
                  
                  {/* Media Type Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-sm flex items-center gap-2">
                      {post.mediaType === 'video' ? (
                        <Video className="w-4 h-4 text-purple-400" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                      )}
                      <span className="text-xs text-white uppercase">{post.mediaType}</span>
                    </div>
                  </div>

                  {/* NSFW Badge */}
                  {post.isNSFW && (
                    <div className="absolute top-3 right-3">
                      <div className="px-3 py-1 rounded-lg bg-red-500/80 backdrop-blur-sm">
                        <span className="text-xs text-white font-semibold">NSFW</span>
                      </div>
                    </div>
                  )}

                  {/* Liked Badge */}
                  <div className="absolute bottom-3 right-3">
                    <div className="p-2 rounded-lg bg-pink-500/80 backdrop-blur-sm">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  {/* Username */}
                  <p className="text-white font-medium mb-3">@{post.username}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <button
                      onClick={(e) => handleUnlike(e, post.id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      {post.reactions}
                    </button>
                    <span className="flex items-center gap-1 text-gray-300">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments}
                    </span>
                    <span className="flex items-center gap-1 text-gray-300">
                      <Eye className="w-4 h-4" />
                      {post.views}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Posted {new Date(post.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                      <span>Liked {new Date(post.likedAt).toLocaleDateString()}</span>
                    </div>
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
