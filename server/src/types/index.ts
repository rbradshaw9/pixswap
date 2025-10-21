import { Document, Types } from 'mongoose';

// User related interfaces
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
  isActive: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  lastSeen: Date;
  blockedUsers: Types.ObjectId[];
  friends: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserProfile {
  _id: string;
  username: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
  isActive: boolean;
  lastSeen: Date;
  createdAt: Date;
}

export interface IUserStats {
  totalPosts: number;
  totalLikes: number;
  totalSwaps: number;
  followerCount: number;
  followingCount: number;
}

// Media related interfaces
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum MediaVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FRIENDS = 'friends',
}

export interface IMedia extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  tags: string[];
  visibility: MediaVisibility;
  expiresAt?: Date;
  isModerated: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  metadata: {
    fileSize: number;
    mimeType: string;
    duration?: number; // for videos
    dimensions: {
      width: number;
      height: number;
    };
  };
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMediaResponse {
  _id: string;
  owner: IUserProfile;
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

// Comment related interfaces
export interface IComment extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  media: Types.ObjectId;
  content: string;
  likes: Types.ObjectId[];
  replies: Types.ObjectId[];
  parentComment?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Message related interfaces
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

export interface IMessage extends Document {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  chatRoom: Types.ObjectId;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  status: MessageStatus;
  reactions: Array<{
    user: Types.ObjectId;
    emoji: string;
  }>;
  expiresAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
}

export interface IMessageResponse {
  _id: string;
  sender: IUserProfile;
  chatRoom: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  status: MessageStatus;
  reactions: Array<{
    user: IUserProfile;
    emoji: string;
  }>;
  expiresAt?: Date;
  editedAt?: Date;
  createdAt: Date;
}

// Chat related interfaces
export enum ChatRoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  TOPIC = 'topic',
}

export interface IChatRoom extends Document {
  _id: Types.ObjectId;
  type: ChatRoomType;
  name?: string; // for group chats
  description?: string;
  avatar?: string;
  participants: Types.ObjectId[];
  admins: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastActivity: Date;
  isActive: boolean;
  settings: {
    allowMediaSharing: boolean;
    messageExpiry?: number; // in seconds
    maxParticipants?: number;
  };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatRoomResponse {
  _id: string;
  type: ChatRoomType;
  name?: string;
  description?: string;
  avatar?: string;
  participants: IUserProfile[];
  admins: IUserProfile[];
  lastMessage?: IMessageResponse;
  lastActivity: Date;
  isActive: boolean;
  unreadCount: number;
  settings: {
    allowMediaSharing: boolean;
    messageExpiry?: number;
    maxParticipants?: number;
  };
  createdBy: IUserProfile;
  createdAt: Date;
}

// Swap related interfaces
export enum SwapStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface ISwap extends Document {
  _id: Types.ObjectId;
  participants: Array<{
    user: Types.ObjectId;
    mediaSubmitted?: Types.ObjectId;
    mediaReceived?: Types.ObjectId;
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
  updatedAt: Date;
}

export interface ISwapResponse {
  _id: string;
  participants: Array<{
    user: IUserProfile;
    mediaSubmitted?: IMediaResponse;
    mediaReceived?: IMediaResponse;
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

// Report related interfaces
export enum ReportType {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  COPYRIGHT = 'copyright',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporter: Types.ObjectId;
  reportedUser?: Types.ObjectId;
  reportedContent?: Types.ObjectId;
  contentType: 'user' | 'media' | 'message' | 'comment';
  type: ReportType;
  description: string;
  status: ReportStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  resolution?: string;
  createdAt: Date;
}

// Auth related interfaces
export interface IJwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface IAuthResponse {
  user: IUserProfile;
  token: string;
  refreshToken?: string;
}

// API Response interfaces
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface IPaginatedResponse<T = any> {
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

// Socket.IO event interfaces
export interface ISocketUser {
  userId: string;
  username: string;
  socketId: string;
  rooms: string[];
  lastSeen: Date;
}

export interface IChatMessageEvent {
  chatRoom: string;
  message: IMessageResponse;
}

export interface ISwapMatchEvent {
  swapId: string;
  participants: string[];
}

export interface IUserStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

// Request interfaces for API endpoints
export interface ISignupRequest {
  username: string;
  email: string;
  password: string;
  bio?: string;
  interests?: string[];
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IUpdateProfileRequest {
  username?: string;
  bio?: string;
  interests?: string[];
  avatar?: string;
}

export interface ICreateMediaRequest {
  caption?: string;
  tags?: string[];
  visibility?: MediaVisibility;
  expiresAt?: Date;
}

export interface ICreateMessageRequest {
  content: string;
  type?: MessageType;
  expiresAt?: Date;
}

export interface ICreateChatRoomRequest {
  type: ChatRoomType;
  name?: string;
  description?: string;
  participants: string[];
  settings?: {
    allowMediaSharing?: boolean;
    messageExpiry?: number;
    maxParticipants?: number;
  };
}

export interface IJoinSwapRequest {
  category?: string;
  theme?: string;
  constraints?: Record<string, any>;
}

// Database query interfaces
export interface IFeedQuery {
  page?: number;
  limit?: number;
  tags?: string[];
  userId?: string;
  visibility?: MediaVisibility;
  sortBy?: 'recent' | 'popular' | 'trending';
}

export interface ISearchQuery {
  q: string;
  type?: 'users' | 'media' | 'all';
  page?: number;
  limit?: number;
}

export interface IUserQuery {
  search?: string;
  isActive?: boolean;
  interests?: string[];
  page?: number;
  limit?: number;
}