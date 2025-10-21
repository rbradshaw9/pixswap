import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

interface SwapData {
  id: string;
  myPhoto: string;
  theirPhoto: string;
  partnerId: string;
  partnerConnected: boolean;
}

export default function SwapChatPage() {
  const { swapId } = useParams<{ swapId: string }>();
  const navigate = useNavigate();
  const socket = useSocket();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [swapData, setSwapData] = useState<SwapData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Load swap data
  useEffect(() => {
    if (!swapId) return;

    const loadSwap = async () => {
      try {
        const response = await api.get<SwapData>(`/swap/${swapId}`);
        setSwapData(response.data as SwapData);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load swap:', error);
        navigate('/');
      }
    };

    loadSwap();
  }, [swapId, navigate]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !swapId) return;

    // Join swap room
    socket.emit('swap:join', { swapId });

    // Listen for new messages
    socket.on('swap:message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for partner disconnect
    socket.on('swap:partner-disconnect', () => {
      if (swapData) {
        setSwapData({ ...swapData, partnerConnected: false });
      }
    });

    // Listen for partner reconnect
    socket.on('swap:partner-connect', () => {
      if (swapData) {
        setSwapData({ ...swapData, partnerConnected: true });
      }
    });

    return () => {
      socket.off('swap:message');
      socket.off('swap:partner-disconnect');
      socket.off('swap:partner-connect');
      socket.emit('swap:leave', { swapId });
    };
  }, [socket, swapId, swapData]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socket || !swapId) return;

    setIsSending(true);
    try {
      socket.emit('swap:message', {
        swapId,
        content: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewSwap = () => {
    navigate('/');
  };

  const handleUploadAdditional = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !swapId) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const axiosInstance = api.getInstance();
      await axiosInstance.post(`/swap/${swapId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Failed to upload photo:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!swapData) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">PixSwap</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  swapData.partnerConnected ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {swapData.partnerConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Button onClick={handleNewSwap} variant="outline">
              <ArrowRight className="w-4 h-4 mr-2" />
              New Swap
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-2 gap-4 p-4">
          {/* Left: Photos */}
          <div className="flex flex-col gap-4 overflow-y-auto">
            {/* My Photo */}
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Your Photo</p>
              <img
                src={swapData.myPhoto}
                alt="Your photo"
                className="w-full h-64 object-cover rounded-lg"
              />
            </Card>

            {/* Their Photo */}
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Their Photo</p>
              <img
                src={swapData.theirPhoto}
                alt="Their photo"
                className="w-full h-64 object-cover rounded-lg"
              />
            </Card>

            {/* Upload Additional */}
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Another Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadAdditional}
              className="hidden"
            />
          </div>

          {/* Right: Chat */}
          <Card className="flex flex-col h-full">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">Chat</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Start the conversation!
                </p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId !== swapData.partnerId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!swapData.partnerConnected}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending || !swapData.partnerConnected}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
