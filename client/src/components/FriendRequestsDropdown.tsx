import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, Loader2, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface FriendRequest {
  _id: string;
  fromUser: string;
  fromUsername: string;
  createdAt: string;
}

export default function FriendRequestsDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<FriendRequest[]>('/swap/friend-requests');
      if (response.success) {
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    fetchRequests();
  }, [isOpen, fetchRequests]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-friend-requests]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  const handleAccept = async (requestId: string) => {
    try {
      const response = await api.post(`/swap/friend-request/${requestId}/accept`);
      if (response.success) {
        toast.success('✅ Friend request accepted');
        fetchRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const response = await api.post(`/swap/friend-request/${requestId}/reject`);
      if (response.success) {
        toast.success('Request rejected');
        fetchRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const pendingCount = requests.length;

  return (
    <div className="relative" data-friend-requests>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-full transition-colors hover:bg-gray-100"
        aria-label="Friend requests"
      >
        <UserPlus className="w-6 h-6 text-gray-700" />
        {pendingCount > 0 && (
          <span className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[10000] max-h-[460px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Friend Requests</h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/friends?tab=requests');
              }}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Manage all
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-10 flex flex-col items-center justify-center text-gray-400 text-sm gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-gray-400 text-sm gap-3">
                <Inbox className="w-6 h-6" />
                No pending requests
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <li key={request._id} className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{request.fromUsername}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request._id)}
                        className="px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
