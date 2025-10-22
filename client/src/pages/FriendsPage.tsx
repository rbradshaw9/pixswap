import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserPlus, Users, Check, X, Clock, Sparkles, MessageCircle } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';

interface FriendRequest {
  _id: string;
  fromUser: string;
  fromUsername: string;
  toUser: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface Friend {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline?: boolean;
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = params.get('tab') === 'requests' ? 'requests' : 'friends';
    setTab(requestedTab);
  }, [location.search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch friends and friend requests in parallel
      const [friendsRes, requestsRes] = await Promise.all([
        api.get('/user/friends'),
        api.get('/swap/friend-requests'),
      ]);

      if (friendsRes.success) {
        setFriends(friendsRes.data as Friend[]);
      }
      if (requestsRes.success) {
        setRequests(requestsRes.data as FriendRequest[]);
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      toast.error('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await api.post(`/swap/friend-request/${requestId}/accept`);
      if (response.success) {
        toast.success('✅ Friend request accepted!');
        fetchData(); // Refresh data
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await api.post(`/swap/friend-request/${requestId}/reject`);
      if (response.success) {
        toast.success('Request rejected');
        fetchData(); // Refresh data
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingCount = requests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <NavBar variant="transparent" showBackButton backTo="/" backLabel="Back to Swap" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            Friends
          </h1>
          <p className="text-gray-400">
            Manage your PixSwap connections
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab('friends')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              tab === 'friends'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Users className="w-5 h-5" />
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all relative ${
              tab === 'requests'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            Requests
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {tab === 'friends' ? (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No friends yet</h3>
                <p className="text-gray-400 mb-6">Start swapping and send friend requests!</p>
                <Button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Start Swapping
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                        {friend.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">
                          {friend.displayName || friend.username}
                        </h3>
                        <p className="text-gray-400 text-sm">@{friend.username}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        title="Chat with friend (coming soon)"
                        disabled
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-12 text-center">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No pending requests</h3>
                <p className="text-gray-400">When someone wants to be friends, you'll see it here!</p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {request.fromUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {request.fromUsername}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request._id)}
                        className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request._id)}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
