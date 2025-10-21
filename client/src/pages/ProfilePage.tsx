import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Image as ImageIcon, Video, Eye, MessageCircle, Sparkles, Calendar, User } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import BlurredNSFWContent from '@/components/BlurredNSFWContent';

interface ProfileContent {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  uploadedAt: number;
  views: number;
  reactions: number;
  isNSFW: boolean;
  caption?: string;
  comments: number;
  liked?: boolean;
  userId?: string;
  username?: string;
}

interface ProfileData {
  username: string;
  joinedAt: string;
  totalUploads: number;
  totalViews: number;
  totalLikes: number;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [content, setContent] = useState<ProfileContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/user/profile/${username}`);
      if (response.success && response.data) {
        setProfileData(response.data.profile);
        setContent(response.data.content || []);
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, contentId: string, currentlyLiked: boolean) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/swap/content/${contentId}/like`);
      setContent(content.map(c => {
        if (c.id === contentId) {
          return {
            ...c,
            liked: !currentlyLiked,
            reactions: currentlyLiked ? c.reactions - 1 : c.reactions + 1
          };
        }
        return c;
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to like content');
    }
  };

  const handleCardClick = (item: ProfileContent) => {
    const contentData = {
      id: item.id,
      userId: item.userId,
      username: username,
      mediaUrl: item.mediaUrl,
      mediaType: item.mediaType,
      caption: item.caption,
      isNSFW: item.isNSFW,
      uploadedAt: item.uploadedAt,
      views: item.views,
      reactions: item.reactions,
    };
    navigate(`/view?content=${encodeURIComponent(JSON.stringify(contentData))}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
        <NavBar variant="transparent" showBackButton backTo="/" backLabel="Back" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Profile not found</h3>
            <p className="text-gray-400 mb-6">{error || 'This user does not exist'}</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.username === username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <NavBar variant="transparent" showBackButton backTo="/" backLabel="Back" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-2xl">
              <User className="w-12 h-12 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">@{username}</h1>
                {isOwnProfile && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-lg">
                    You
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-gray-400 mb-6">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profileData.joinedAt).toLocaleDateString()}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{profileData.totalUploads}</div>
                  <div className="text-sm text-gray-400">Posts</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{profileData.totalLikes}</div>
                  <div className="text-sm text-gray-400">Likes</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{profileData.totalViews}</div>
                  <div className="text-sm text-gray-400">Views</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isOwnProfile && (
              <Button
                onClick={() => navigate('/my-uploads')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Manage Uploads
              </Button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {isOwnProfile ? 'Your' : `${username}'s`} Posts
          </h2>
        </div>

        {content.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400">
              {isOwnProfile ? "You haven't uploaded any content yet" : "This user hasn't uploaded any content yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all cursor-pointer group"
              >
                {/* Media Preview */}
                <div className="relative aspect-square bg-black/50">
                  <BlurredNSFWContent isNSFW={item.isNSFW}>
                    {item.mediaType === 'video' ? (
                      <video
                        src={item.mediaUrl.startsWith('http') ? item.mediaUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${item.mediaUrl}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.mediaUrl.startsWith('http') ? item.mediaUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${item.mediaUrl}`}
                        alt="Content"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </BlurredNSFWContent>
                </div>

                {/* Info */}
                <div className="p-4">
                  {/* Caption */}
                  {item.caption && (
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{item.caption}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <button
                      onClick={(e) => handleLike(e, item.id, item.liked || false)}
                      className={`flex items-center gap-1 transition-colors ${
                        item.liked ? 'text-red-400' : 'text-gray-300 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${item.liked ? 'fill-current' : ''}`} />
                      {item.reactions}
                    </button>
                    <span className="flex items-center gap-1 text-gray-300">
                      <MessageCircle className="w-4 h-4" />
                      {item.comments || 0}
                    </span>
                    <span className="flex items-center gap-1 text-gray-300">
                      <Eye className="w-4 h-4" />
                      {item.views}
                    </span>
                  </div>

                  {/* Upload Date */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
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