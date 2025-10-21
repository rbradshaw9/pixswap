// Shared types between frontend and backend
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
  isActive: boolean;
  isAdmin?: boolean;
  lastSeen: Date;
  createdAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: Date;
}

// Media types
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum MediaVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FRIENDS = 'friends',
}

export interface Media {
  _id: string;
  owner: User;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  tags: string[];
  visibility: MediaVisibility;
  expiresAt?: Date;
  metadata: {
    fileSize: number;
    mimeType: string;
    duration?: number;
    dimensions: {
      width: number;
      height: number;
    };
  };
  likesCount: number;
  commentsCount: number;
  views: number;
  isLiked: boolean;
  createdAt: Date;
}

// Chat types
export enum ChatRoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  TOPIC = 'topic',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  EMOJI = 'emoji',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export interface Message {
  _id: string;
  sender: User;
  chatRoom: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  status: MessageStatus;
  reactions: Array<{
    user: User;
    emoji: string;
  }>;
  expiresAt?: Date;
  editedAt?: Date;
  createdAt: Date;
}

export interface ChatRoom {
  _id: string;
  type: ChatRoomType;
  name?: string;
  description?: string;
  avatar?: string;
  participants: User[];
  admins: User[];
  lastMessage?: Message;
  lastActivity: Date;
  isActive: boolean;
  unreadCount: number;
  settings: {
    allowMediaSharing: boolean;
    messageExpiry?: number;
    maxParticipants?: number;
  };
  createdBy: User;
  createdAt: Date;
}

// Swap types
export enum SwapStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface Swap {
  _id: string;
  participants: Array<{
    user: User;
    mediaSubmitted?: Media;
    mediaReceived?: Media;
    submittedAt?: Date;
    revealedAt?: Date;
  }>;
  status: SwapStatus;
  matchedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  metadata: {
    category?: string;
    theme?: string;
    constraints?: Record<string, any>;
  };
  createdAt: Date;
}

// Comment types
export interface Comment {
  _id: string;
  author: User;
  media: string;
  content: string;
  likesCount: number;
  replies: Comment[];
  parentComment?: string;
  isLiked: boolean;
  createdAt: Date;
}

// Form types
export interface SignupForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  bio?: string;
  interests?: string[];
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface ProfileUpdateForm {
  username?: string;
  bio?: string;
  interests?: string[];
  avatar?: File;
}

export interface MediaUploadForm {
  file: File;
  caption?: string;
  tags?: string[];
  visibility?: MediaVisibility;
  expiresAt?: Date;
}

export interface MessageForm {
  content: string;
  type?: MessageType;
  mediaFile?: File;
  expiresAt?: Date;
}

// Socket.IO event types
export interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
  rooms: string[];
  lastSeen: Date;
}

export interface ChatMessageEvent {
  chatRoom: string;
  message: Message;
}

export interface SwapMatchEvent {
  swapId: string;
  participants: string[];
}

export interface UserStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

// App state types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FeedState {
  posts: Media[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
}

export interface ChatState {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
}

export interface SwapState {
  activeSwaps: Swap[];
  swapQueue: boolean;
  currentSwap: Swap | null;
  isLoading: boolean;
  error: string | null;
}

// Utility types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  q?: string;
  type?: 'users' | 'media' | 'all';
}

export interface FeedParams extends PaginationParams {
  tags?: string[];
  userId?: string;
  visibility?: MediaVisibility;
  sortBy?: 'recent' | 'popular' | 'trending';
}