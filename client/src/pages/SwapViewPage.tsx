import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, SkipForward, UserPlus, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function SwapViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [isNSFW, setIsNSFW] = useState(false);

  useEffect(() => {
    const contentData = searchParams.get('content');
    if (contentData) {
      try {
        setContent(JSON.parse(decodeURIComponent(contentData)));
      } catch (err) {
        console.error('Failed to parse content:', err);
      }
    }
  }, [searchParams]);

  const handleLike = async () => {
    setLiked(!liked);
    // In production, send to backend
  };

  const handleComment = async () => {
    if (!comment.trim() || !content) return;

    try {
      const axiosInstance = api.getInstance();
      await axiosInstance.post(`/swap/${content.id}/react`, {
        like: !liked,
        comment: comment || undefined,
      });

      setComment('');
      alert('Comment sent! 💬');
    } catch (err) {
      console.error('Failed to send comment:', err);
    }
  };

  const handleFriend = async () => {
    if (!content) return;

    try {
      const axiosInstance = api.getInstance();
      await axiosInstance.post(`/swap/${content.id}/friend`, {
        message: 'Friend request',
      });

      alert('Friend request sent! 👋');
    } catch (err) {
      console.error('Failed to send friend request:', err);
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      const axiosInstance = api.getInstance();
      const response = await axiosInstance.post('/swap/next', {
        currentContentId: content.id,
        isNSFW,
      });      if (response.data.success && response.data.content) {
        setContent(response.data.content);
      } else {
        alert(response.data.message || 'No more content available');
      }
    } catch (err) {
      console.error('Failed to get next content:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Upload Another</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                PixSwap
              </span>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
              {content.mediaType === 'video' ? (
                <video
                  src={content.mediaUrl.startsWith('http') ? content.mediaUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${content.mediaUrl}`}
                  controls
                  className="w-full max-h-[70vh] object-contain bg-black"
                />
              ) : (
                <img
                  src={content.mediaUrl.startsWith('http') ? content.mediaUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${content.mediaUrl}`}
                  alt="Swapped content"
                  className="w-full max-h-[70vh] object-contain bg-black"
                />
              )}
              
              {/* Action Bar */}
              <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        liked
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{liked ? 'Liked' : 'Like'}</span>
                    </button>

                    <button
                      onClick={handleFriend}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="font-medium hidden sm:inline">Add Friend</span>
                    </button>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 transition-all">
                      <Share2 className="w-5 h-5" />
                      <span className="font-medium hidden sm:inline">Share</span>
                    </button>
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {loading ? 'Loading...' : (
                      <>
                        <SkipForward className="w-5 h-5" />
                        Next
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-gray-400 text-sm">
                  Uploaded {new Date(content.uploadedAt).toLocaleDateString()} at{' '}
                  {new Date(content.uploadedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Comments */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Leave a Comment
              </h3>

              <div className="space-y-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Say something nice... 💬"
                  className="w-full h-32 px-4 py-3 bg-black/20 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                  maxLength={500}
                />

                <Button
                  onClick={handleComment}
                  disabled={!comment.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  Send Comment
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <h4 className="text-sm font-semibold text-gray-300 mb-4">About This Swap</h4>
                <div className="space-y-3 text-sm text-gray-400">
                  <p className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-white font-medium capitalize">{content.mediaType}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Views:</span>
                    <span className="text-white font-medium">{content.views || 0}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Reactions:</span>
                    <span className="text-white font-medium">{content.reactions || 0}</span>
                  </p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20">
                <p className="text-xs text-gray-300 leading-relaxed">
                  <span className="text-orange-400 font-semibold">⏱️ Auto-deletes in 24h</span>
                  <br />
                  All content is temporary and automatically removed for your privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
