import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, SkipForward, UserPlus, ArrowLeft, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  username: string;
  text: string;
  createdAt: string;
}

export default function SwapViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [content, setContent] = useState<any>(null);
  const [contentUserId, setContentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isNSFW, setIsNSFW] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [reactionsCount, setReactionsCount] = useState(0);

  useEffect(() => {
    const contentData = searchParams.get('content');
    if (contentData) {
      try {
        const parsedContent = JSON.parse(decodeURIComponent(contentData));
        setContent(parsedContent);
        setContentUserId(parsedContent.userId || null);
        setViewsCount(parsedContent.views || 0);
        setReactionsCount(parsedContent.reactions || 0);
        fetchComments(parsedContent.id);
        // Track view
        trackView(parsedContent.id);
      } catch (err) {
        console.error('Failed to parse content:', err);
      }
    }
  }, [searchParams]);

  const trackView = async (contentId: string) => {
    try {
      // Silently track view - no need to wait or show errors
      api.post(`/swap/${contentId}/react`, { type: 'view' });
    } catch (err) {
      // Ignore view tracking errors
    }
  };

  const fetchComments = async (contentId: string) => {
    try {
      const response = await api.get(`/swap/content/${contentId}/comments`);
      if (response.success && response.data) {
        const data = response.data as { comments: Comment[]; likes: number };
        setComments(data.comments || []);
        setLikesCount(data.likes || 0);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleReaction = async () => {
    if (!content) return;
    try {
      await api.post(`/swap/${content.id}/react`, { type: 'reaction' });
      setReactionsCount(prev => prev + 1);
      toast.success('🎉 Reaction added!');
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like content');
      navigate('/login');
      return;
    }

    if (!content) return;

    try {
      const axiosInstance = api.getInstance();
      const response = await axiosInstance.post(`/swap/content/${content.id}/like`);
      if (response.data.success) {
        const data = response.data.data as { liked: boolean };
        setLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
        toast.success(data.liked ? '❤️ Liked!' : 'Like removed');
      }
    } catch (err: any) {
      console.error('Failed to like:', err);
      toast.error(err.response?.data?.message || 'Failed to like content');
    }
  };

  const handleComment = async () => {
    if (!comment.trim() || !content) return;

    if (!isAuthenticated) {
      toast.error('Please login to comment');
      navigate('/login');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await api.post(`/swap/content/${content.id}/comment`, {
        text: comment.trim(),
      });

      if (response.success) {
        setComment('');
        toast.success('💬 Comment posted!');
        // Refresh comments
        await fetchComments(content.id);
      }
    } catch (err: any) {
      console.error('Failed to send comment:', err);
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFriend = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to send friend requests');
      navigate('/login');
      return;
    }

    if (!content || !contentUserId) return;

    // Check if uploader is a real user (not temp ID)
    if (contentUserId.startsWith('temp-')) {
      toast.error('This user uploaded anonymously');
      return;
    }

    try {
      const axiosInstance = api.getInstance();
      await axiosInstance.post(`/swap/${content.id}/friend`, {
        friendUserId: contentUserId,
        message: 'Friend request',
      });

      toast.success('Friend request sent! 👋');
    } catch (err) {
      console.error('Failed to send friend request:', err);
      toast.error('Failed to send friend request');
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      const axiosInstance = api.getInstance();
      const formData = new FormData();
      formData.append('userId', user?._id || `temp-${Date.now()}`);
      formData.append('isNSFW', isNSFW.toString());

      const response = await axiosInstance.post('/swap/next', formData);

      if (response.data.success && response.data.content) {
        const newContent = response.data.content;
        setContent(newContent);
        setContentUserId(newContent.userId || null);
        setViewsCount(newContent.views || 0);
        setReactionsCount(newContent.reactions || 0);
        setLiked(false);
        setComment('');
        setComments([]);
        setLikesCount(0);
        await fetchComments(newContent.id);
        // Track view of new content
        trackView(newContent.id);
      } else {
        toast(response.data.message || 'No more content available', {
          icon: 'ℹ️',
        });
      }
    } catch (err: any) {
      console.error('Failed to get next content:', err);
      toast.error('Failed to load next content');
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
                      <span className="font-medium">{likesCount > 0 ? likesCount : (liked ? 'Liked' : 'Like')}</span>
                    </button>

                    {contentUserId && !contentUserId.startsWith('temp-') && (
                      <button
                        onClick={handleFriend}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
                      >
                        <UserPlus className="w-5 h-5" />
                        <span className="font-medium hidden sm:inline">Add Friend</span>
                      </button>
                    )}

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
                Comments ({comments.length})
              </h3>

              {/* Comment Input */}
              <div className="space-y-3 mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isAuthenticated ? "Say something nice... 💬" : "Login to comment..."}
                  disabled={!isAuthenticated}
                  className="w-full h-24 px-4 py-3 bg-black/20 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={500}
                />

                <Button
                  onClick={handleComment}
                  disabled={!comment.trim() || submittingComment || !isAuthenticated}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    No comments yet. Be the first! 💬
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c._id}
                      className="bg-black/20 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                          {c.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">
                              {c.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {c.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
                    <span className="text-white font-medium">{viewsCount}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Reactions:</span>
                    <span className="text-white font-medium">{reactionsCount}</span>
                  </p>
                  <button
                    onClick={handleReaction}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white text-sm font-medium transition-all"
                  >
                    🎉 React
                  </button>
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
