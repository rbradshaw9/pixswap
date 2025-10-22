import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, MessageCircle, Loader2, Users, MailPlus, Paperclip, Image as ImageIcon, Video, X, Clock, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useSocket } from '@/hooks/useSocket';

interface ParticipantSummary {
  _id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
}

interface ChatMessage {
  _id: string;
  chatRoom: string;
  type: string;
  content: string;
  mediaUrl?: string | null;
  status: string;
  createdAt: string;
  sender: ParticipantSummary | null;
}

interface ChatRoomSummary {
  _id: string;
  type: string;
  name?: string | null;
  description?: string | null;
  avatar?: string | null;
  lastActivity: string;
  unreadCount: number;
  participants: ParticipantSummary[];
  lastMessage?: ChatMessage | null;
  createdAt: string;
}

type DirectChatResponse = {
  _id: string;
  type: string;
  name?: string | null;
  description?: string | null;
  lastActivity: string;
  unreadCount: number;
  participants: ParticipantSummary[];
  lastMessage?: ChatMessage | null;
  createdAt: string;
};

interface UserUpload {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { username: targetUsername } = useParams<{ username?: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const socket = useSocket();

  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaMode, setMediaMode] = useState<'upload' | 'select' | null>(null);
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);
  const [userUploads, setUserUploads] = useState<UserUpload[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view your messages');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const loadRooms = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoadingRooms(true);
      const response = await api.get<ChatRoomSummary[]>('/chat/rooms');
      if (response.success) {
        setRooms(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoadingRooms(false);
    }
  }, [isAuthenticated]);

  const loadUserUploads = useCallback(async () => {
    if (!user?.username) return;

    try {
      setLoadingUploads(true);
      const response = await api.get<{ content: any[] }>(`/user/profile/${user.username}`);
      if (response.success && response.data?.content) {
        const uploads: UserUpload[] = response.data.content.map((item: any) => ({
          id: item._id,
          mediaUrl: item.mediaUrl,
          mediaType: item.mediaType
        }));
        setUserUploads(uploads);
      }
    } catch (error) {
      console.error('Failed to load uploads:', error);
      toast.error('Failed to load your uploads');
    } finally {
      setLoadingUploads(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!targetUsername || creatingChat || loadingRooms) {
      return;
    }

    const existingRoom = rooms.find(
      (room) =>
        room.type === 'direct' &&
        room.participants.some((participant) => participant.username === targetUsername)
    );

    if (existingRoom) {
      setSelectedRoomId(existingRoom._id);
      return;
    }

    const ensureDirectChat = async () => {
      try {
        setCreatingChat(true);
        const response = await api.post<DirectChatResponse>('/chat/direct', {
          username: targetUsername,
        });

        if (response.success && response.data) {
          const room = response.data;
          setRooms((prev) => {
            const existing = prev.some((r) => r._id === room._id);
            if (existing) {
              return prev.map((r) => (r._id === room._id ? room : r));
            }
            return [room, ...prev];
          });
          setSelectedRoomId(room._id);
        }
      } catch (error: any) {
        console.error('Failed to create direct chat:', error);
        toast.error(error.response?.data?.message || 'Failed to start chat');
      } finally {
        setCreatingChat(false);
      }
    };

    ensureDirectChat();
  }, [targetUsername, rooms, creatingChat, loadingRooms]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return rooms.find((room) => room._id === selectedRoomId) || null;
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!socket) return;

    const joined = joinedRoomsRef.current;
    const currentRoomIds = new Set(rooms.map((room) => room._id));

    rooms.forEach((room) => {
      if (!joined.has(room._id)) {
        socket.emit('chat:join', room._id);
        joined.add(room._id);
      }
    });

    const toRemove: string[] = [];
    joined.forEach((roomId) => {
      if (!currentRoomIds.has(roomId)) {
        toRemove.push(roomId);
      }
    });

    toRemove.forEach((roomId) => {
      socket.emit('chat:leave', roomId);
      joined.delete(roomId);
    });
  }, [socket, rooms]);

  useEffect(() => {
    if (!socket) return;

    return () => {
      joinedRoomsRef.current.forEach((roomId) => socket.emit('chat:leave', roomId));
      joinedRoomsRef.current.clear();
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await api.get<ChatMessage[]>(`/chat/rooms/${selectedRoomId}/messages`);
        if (response.success) {
          setMessages(response.data || []);
          setRooms((prev) =>
            prev.map((room) =>
              room._id === selectedRoomId ? { ...room, unreadCount: 0 } : room
            )
          );
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedRoomId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload: { roomId: string; message: ChatMessage }) => {
      const { roomId, message } = payload;

      let roomExists = true;

      setRooms((prev) => {
        const exists = prev.some((room) => room._id === roomId);
        roomExists = exists;

        if (!exists) {
          return prev;
        }

        return prev.map((room) => {
          if (room._id !== roomId) {
            const isUnreadIncrement = message.sender?._id !== user?._id;
            return {
              ...room,
              unreadCount: isUnreadIncrement ? room.unreadCount + 1 : room.unreadCount,
              lastMessage: message,
              lastActivity: message.createdAt,
            };
          }

          return {
            ...room,
            unreadCount: roomId === selectedRoomId ? 0 : room.unreadCount,
            lastMessage: message,
            lastActivity: message.createdAt,
          };
        });
      });

      if (!roomExists) {
        loadRooms();
      }

      if (roomId === selectedRoomId) {
        setMessages((prev) => {
          const alreadyExists = prev.some((existing) => existing._id === message._id);
          if (alreadyExists) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on('chat:message:new', handleNewMessage);

    return () => {
      socket.off('chat:message:new', handleNewMessage);
    };
  }, [socket, selectedRoomId, user?._id, loadRooms]);

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0]._id);
    }
  }, [rooms, selectedRoomId]);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (targetUsername) {
      navigate('/messages');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be under 100MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleOpenMediaModal = () => {
    setShowMediaModal(true);
    setMediaMode(null);
    setSelectedFile(null);
    setSelectedUploadId(null);
    setExpiryMinutes(null);
  };

  const handleSelectUploadMode = () => {
    setMediaMode('upload');
    fileInputRef.current?.click();
  };

  const handleSelectFromUploads = async () => {
    setMediaMode('select');
    await loadUserUploads();
  };

  const handleSendMedia = async () => {
    if (!selectedRoomId) return;

    try {
      setSending(true);
      let response;

      if (mediaMode === 'upload' && selectedFile) {
        // Upload new file
        const formData = new FormData();
        formData.append('media', selectedFile);
        formData.append('content', newMessage.trim() || 'Sent a file');
        if (expiryMinutes) {
          const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
          formData.append('expiresAt', expiresAt.toISOString());
        }

        const axiosInstance = api.getInstance();
        response = await axiosInstance.post(
          `/chat/rooms/${selectedRoomId}/messages/media`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      } else if (mediaMode === 'select' && selectedUploadId) {
        // Use existing upload
        response = await api.post(`/chat/rooms/${selectedRoomId}/messages/existing`, {
          contentId: selectedUploadId,
          content: newMessage.trim() || 'Shared a file',
          expiryMinutes: expiryMinutes || undefined,
        });
      }

      if (response?.data?.success && response.data.data) {
        const message = response.data.data;
        setMessages((prev) => {
          const alreadyExists = prev.some((existing) => existing._id === message._id);
          if (alreadyExists) return prev;
          return [...prev, message];
        });
        setNewMessage('');
        setShowMediaModal(false);
        setSelectedFile(null);
        setSelectedUploadId(null);
        setMediaMode(null);
        setExpiryMinutes(null);
        toast.success('Media sent!');
      }
    } catch (error: any) {
      console.error('Failed to send media:', error);
      toast.error(error.response?.data?.message || 'Failed to send media');
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRoomId || !newMessage.trim()) {
      return;
    }

    try {
      setSending(true);
      const response = await api.post<ChatMessage>(`/chat/rooms/${selectedRoomId}/messages`, {
        content: newMessage.trim(),
      });

      if (response.success && response.data) {
        const message = response.data;
        setMessages((prev) => {
          const alreadyExists = prev.some((existing) => existing._id === message._id);
          if (alreadyExists) return prev;
          return [...prev, message];
        });
        setNewMessage('');
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async (participant: ParticipantSummary) => {
    if (participant._id === user?._id) {
      toast('You are already in this chat');
      return;
    }

    try {
      const response = await api.post<DirectChatResponse>('/chat/direct', {
        username: participant.username,
      });

      if (response.success && response.data) {
        const room = response.data;
        setRooms((prev) => {
          const exists = prev.some((existing) => existing._id === room._id);
          if (exists) {
            return prev.map((existing) => (existing._id === room._id ? room : existing));
          }
          return [room, ...prev];
        });
        setSelectedRoomId(room._id);
        navigate('/messages');
      }
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const renderRoomName = (room: ChatRoomSummary) => {
    if (room.type === 'direct') {
      const otherParticipant = room.participants.find((participant) => participant._id !== user?._id);
      return otherParticipant?.displayName || otherParticipant?.username || 'Direct Chat';
    }

    return room.name || 'Group Chat';
  };

  const renderRoomSubtitle = (room: ChatRoomSummary) => {
    if (room.lastMessage?.sender) {
      const senderName = room.lastMessage.sender.displayName || room.lastMessage.sender.username;
      return `${senderName}: ${room.lastMessage.content}`;
    }

    if (room.type === 'direct') {
      const otherParticipant = room.participants.find((participant) => participant._id !== user?._id);
      return otherParticipant?.username ? `@${otherParticipant.username}` : 'Start the conversation';
    }

    return room.description || 'No messages yet';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 text-white">
      <NavBar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          {/* Conversations List */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5 text-purple-200" />
                <h2 className="text-lg font-semibold">Conversations</h2>
              </div>
              <p className="text-xs text-gray-400">Chat with friends and people you meet through swaps.</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingRooms ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-sm text-gray-300">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading conversations...
                </div>
              ) : rooms.length === 0 ? (
                <div className="py-16 px-6 text-center text-sm text-gray-300">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                  <p>No conversations yet.</p>
                  <p className="text-xs text-gray-500 mt-2">Start chatting by opening a swap or viewing someone&apos;s profile.</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {rooms.map((room) => (
                    <li key={room._id}>
                      <button
                        onClick={() => handleSelectRoom(room._id)}
                        className={`w-full text-left px-5 py-4 transition-colors flex flex-col gap-2 ${
                          selectedRoomId === room._id
                            ? 'bg-white/15'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="text-sm font-semibold truncate">
                                {renderRoomName(room)}
                              </h3>
                              {room.unreadCount > 0 && (
                                <span className="text-xs bg-pink-500/90 text-white px-2 py-0.5 rounded-full">
                                  {room.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate">
                              {renderRoomSubtitle(room)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Active Conversation */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col min-h-[60vh]">
            {selectedRoom ? (
              <>
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {renderRoomName(selectedRoom)}
                    </h2>
                    <p className="text-xs text-gray-300">
                      {selectedRoom.type === 'direct'
                        ? 'Direct messages'
                        : `${selectedRoom.participants.length} participants`}
                    </p>
                  </div>
                  {selectedRoom.type === 'direct' && (
                    <Button
                      variant="ghost"
                      className="text-sm text-gray-200 hover:text-white"
                      onClick={() => {
                        const other = selectedRoom.participants.find((participant) => participant._id !== user?._id);
                        if (other) {
                          handleStartChat(other);
                        }
                      }}
                    >
                      <MailPlus className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingMessages ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-sm text-gray-300">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-300">
                      <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                      No messages yet. Say hello! 👋
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                      const isOwnMessage = message.sender?._id === user?._id;
                      const isMedia = message.type === 'image' || message.type === 'video';
                      return (
                        <div key={message._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-sm px-4 py-2 rounded-2xl text-sm shadow-lg ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-white/10 text-gray-100'
                            }`}
                          >
                            {!isOwnMessage && (
                              <p className="text-xs text-purple-200 font-semibold mb-1">
                                {message.sender?.displayName || message.sender?.username || 'Guest'}
                              </p>
                            )}
                            {isMedia && message.mediaUrl && (
                              <div className="mb-2">
                                {message.type === 'image' ? (
                                  <img
                                    src={message.mediaUrl}
                                    alt="Shared image"
                                    className="rounded-lg max-w-full h-auto"
                                  />
                                ) : (
                                  <video
                                    src={message.mediaUrl}
                                    controls
                                    className="rounded-lg max-w-full h-auto"
                                  />
                                )}
                              </div>
                            )}
                            {message.content && (
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                            )}
                            <p className="mt-2 text-[10px] uppercase tracking-wide text-white/70">
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="border-t border-white/10 p-5">
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      onClick={handleOpenMediaModal}
                      disabled={sending}
                      className="text-gray-300 hover:text-white"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 placeholder:text-gray-500"
                      disabled={sending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center text-sm text-gray-200">
                <MessageCircle className="w-10 h-10 text-gray-400" />
                <div>
                  <p className="font-semibold text-base text-white mb-1">Select a conversation</p>
                  <p className="text-xs text-gray-400">Choose someone to chat with from your conversations list.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-3xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Send Media</h3>
              <button
                onClick={() => {
                  setShowMediaModal(false);
                  setMediaMode(null);
                  setSelectedFile(null);
                  setSelectedUploadId(null);
                  setExpiryMinutes(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!mediaMode ? (
              <div className="space-y-3">
                <button
                  onClick={handleSelectUploadMode}
                  className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 flex items-center gap-4 transition-all group"
                >
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Upload New Photo/Video</p>
                    <p className="text-sm text-gray-400">Take or select from device</p>
                  </div>
                </button>

                <button
                  onClick={handleSelectFromUploads}
                  className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 flex items-center gap-4 transition-all group"
                >
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl group-hover:scale-110 transition-transform">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">Choose from My Uploads</p>
                    <p className="text-sm text-gray-400">Select from your content</p>
                  </div>
                </button>
              </div>
            ) : mediaMode === 'upload' && selectedFile ? (
              <div className="space-y-4">
                <div className="p-4 bg-black/30 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    {selectedFile.type.startsWith('image') ? (
                      <ImageIcon className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Video className="w-5 h-5 text-purple-400" />
                    )}
                    <span className="text-sm text-gray-300 truncate flex-1">{selectedFile.name}</span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setMediaMode(null);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Auto-delete after:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { label: 'Never', value: null },
                        { label: 'After seen', value: 0 },
                        { label: '5 min', value: 5 },
                        { label: '30 min', value: 30 },
                        { label: '1 hour', value: 60 },
                        { label: '24 hours', value: 1440 },
                      ].map((option) => (
                        <button
                          key={option.label}
                          onClick={() => setExpiryMinutes(option.value)}
                          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                            expiryMinutes === option.value
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setMediaMode(null);
                      setSelectedFile(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSendMedia}
                    disabled={sending}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : mediaMode === 'select' ? (
              <div className="space-y-4">
                {loadingUploads ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
                    <p className="text-gray-400">Loading your uploads...</p>
                  </div>
                ) : userUploads.length === 0 ? (
                  <div className="py-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No uploads yet</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {userUploads.map((upload) => (
                        <button
                          key={upload.id}
                          onClick={() => setSelectedUploadId(upload.id)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                            selectedUploadId === upload.id
                              ? 'border-purple-500 scale-95'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          {upload.mediaType === 'image' ? (
                            <img
                              src={upload.mediaUrl}
                              alt="Upload"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={upload.mediaUrl}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {selectedUploadId === upload.id && (
                            <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {selectedUploadId && (
                      <div className="space-y-3 mt-4">
                        <label className="block">
                          <span className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Auto-delete after:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {[
                              { label: 'Never', value: null },
                              { label: 'After seen', value: 0 },
                              { label: '5 min', value: 5 },
                              { label: '30 min', value: 30 },
                              { label: '1 hour', value: 60 },
                              { label: '24 hours', value: 1440 },
                            ].map((option) => (
                              <button
                                key={option.label}
                                onClick={() => setExpiryMinutes(option.value)}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                  expiryMinutes === option.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </label>
                      </div>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => {
                          setMediaMode(null);
                          setSelectedUploadId(null);
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSendMedia}
                        disabled={!selectedUploadId || sending}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
