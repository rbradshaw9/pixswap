import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  Search, 
  Edit2, 
  Trash2, 
  Ban, 
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  UserCog,
  LogOut,
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  Flame,
  MessageCircle,
  Bug
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import ProtectedMedia from '@/components/ProtectedMedia';
import { debug } from '@/lib/debug';

interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  interests?: string[];
  isActive: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastSeen: string;
}

interface MediaContent {
  _id: string;
  userId: string;
  username?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  isNSFW: boolean;
  views: number;
  reactions: number;
  comments: number;
  uploadedAt: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  verifiedUsers: number;
  adminUsers: number;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'users' | 'media'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [media, setMedia] = useState<MediaContent[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [debugMode, setDebugMode] = useState(debug.isEnabled);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'sfw' | 'nsfw'>('all');

  useEffect(() => {
    // Check if user is admin
    if (!isAuthenticated || !user?.isAdmin) {
      navigate('/');
      return;
    }

    fetchStats();
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchMedia();
    }
  }, [isAuthenticated, user, navigate, page, search, activeTab, mediaFilter]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      if (response.success && response.data) {
        const data = response.data as any;
        setStats(data.stats as AdminStats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchMedia = async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (mediaFilter !== 'all') {
        params.isNSFW = mediaFilter === 'nsfw';
      }

      console.log('📚 Fetching media with params:', params);

      const response = await api.get('/admin/media', params);
      
      console.log('📚 Media response:', {
        success: response.success,
        hasData: !!response.data,
        contentsLength: response.data?.contents?.length,
        total: response.data?.pagination?.total,
      });

      if (response.success && response.data) {
        const data = response.data as { contents: MediaContent[]; pagination: { pages: number } };
        setMedia(data.contents || []);
        setTotalPages(data.pagination.pages || 1);
        console.log('📚 Set media state:', data.contents?.length, 'items');
      } else {
        console.log('❌ No data in response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch media:', error);
      toast.error('Failed to load media library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/media/${contentId}`);
      if (response.success) {
        toast.success('Content deleted successfully');
        fetchMedia();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete content');
    }
  };

  const handleToggleNSFW = async (contentId: string) => {
    try {
      const response = await api.patch(`/admin/media/${contentId}/nsfw`);
      if (response.success) {
        toast.success(response.message || 'Content updated');
        fetchMedia();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update content');
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;

      const response = await api.get('/admin/users', params);
      if (response.success && response.data) {
        const data = response.data as { users: User[]; pagination: { pages: number } };
        setUsers(data.users || []);
        setTotalPages(data.pagination.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlock = async (userId: string) => {
    try {
      const response = await api.post(`/admin/users/${userId}/toggle-block`);
      if (response.success) {
        toast.success(response.message || 'User updated');
        fetchUsers();
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle block');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.delete(`/admin/users/${userId}`);
      if (response.success) {
        toast.success('User deleted successfully');
        fetchUsers();
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, updates);
      if (response.success) {
        toast.success('User updated successfully');
        setEditingUser(null);
        fetchUsers();
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar variant="default" showBackButton backTo="/" backLabel="Back to App" />
      
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={() => {
                debug.toggle();
                setDebugMode(debug.isEnabled);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                debugMode 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bug className="w-4 h-4" />
              Debug {debugMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard 
              icon={Users} 
              label="Total Users" 
              value={stats.totalUsers} 
              color="bg-blue-500"
            />
            <StatCard 
              icon={CheckCircle} 
              label="Active Users" 
              value={stats.activeUsers} 
              color="bg-green-500"
            />
            <StatCard 
              icon={XCircle} 
              label="Blocked Users" 
              value={stats.blockedUsers} 
              color="bg-red-500"
            />
            <StatCard 
              icon={Shield} 
              label="Verified Users" 
              value={stats.verifiedUsers} 
              color="bg-purple-500"
            />
            <StatCard 
              icon={UserCog} 
              label="Admins" 
              value={stats.adminUsers} 
              color="bg-orange-500"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('users');
                setPage(1);
                setSearch('');
              }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              User Management
            </button>
            <button
              onClick={() => {
                setActiveTab('media');
                setPage(1);
                setSearch('');
              }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'media'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              Media Library
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder={activeTab === 'users' ? "Search by username or email..." : "Search by username or caption..."}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {activeTab === 'media' && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMediaFilter('all');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mediaFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setMediaFilter('sfw');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mediaFilter === 'sfw'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  SFW
                </button>
                <button
                  onClick={() => {
                    setMediaFilter('nsfw');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mediaFilter === 'nsfw'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  NSFW
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{u.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {u.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-1">
                          {u.isAdmin && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                              Admin
                            </span>
                          )}
                          {u.isVerified && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(u._id)}
                            className={u.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                            title={u.isActive ? 'Block user' : 'Unblock user'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Media Library Grid */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                Loading media...
              </div>
            ) : media.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                No media found
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {media.map((item) => (
                    <div key={item._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="relative aspect-square bg-gray-100">
                        <ProtectedMedia
                          mediaUrl={item.mediaUrl.startsWith('http') ? item.mediaUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${item.mediaUrl}`}
                          mediaType={item.mediaType}
                          alt={item.caption || 'Content'}
                          className="w-full h-full object-cover"
                          showWatermark={false}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          {item.isNSFW && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              NSFW
                            </span>
                          )}
                          {item.mediaType === 'video' && (
                            <span className="px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              Video
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              @{item.username || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {item.caption && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {item.caption}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {item.comments}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleNSFW(item._id)}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              item.isNSFW
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title={item.isNSFW ? 'Mark as SFW' : 'Mark as NSFW'}
                          >
                            {item.isNSFW ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {item.isNSFW ? 'SFW' : 'NSFW'}
                          </button>
                          <button
                            onClick={() => handleDeleteContent(item._id)}
                            className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Delete content"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <Button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page <span className="font-medium">{page}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Input
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingUser.isVerified}
                    onChange={(e) => setEditingUser({ ...editingUser, isVerified: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Verified</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingUser.isAdmin}
                    onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Admin</span>
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleUpdateUser(editingUser._id, {
                    username: editingUser.username,
                    email: editingUser.email,
                    isVerified: editingUser.isVerified,
                    isAdmin: editingUser.isAdmin,
                  })}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setEditingUser(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
