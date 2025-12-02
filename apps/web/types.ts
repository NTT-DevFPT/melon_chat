// This file reflects the Database Schema discussed in the architecture.
// It serves as the contract between the Frontend and the Microservices.

// --- Users Service (PostgreSQL) ---
export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  status: UserStatus;
  lastSeen: string; // ISO Date
}

export interface PendingFriendRequest {
  id: string;
  requesterId: string;
  requesterName: string | null;
  requesterUsername: string | null;
  requesterAvatarUrl: string | null;
  createdAt: string;
}

// --- Chat Service (MongoDB for History, Redis for Recent) ---
export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export interface Participant {
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string; // For groups
  avatarUrl?: string; // For groups
  participants?: string[]; // Array of User IDs, optional when backend omits
  lastMessageId?: string;
  lastMessageContent?: string;
  lastMessageSenderId?: string; // ID of the sender of the last message
  lastMessageAt?: string;
  unreadCount?: number;
  updatedAt?: string;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export interface Attachment {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE';
  name: string;
  size: number;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string; // Text content or Caption
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachments?: Attachment[];
  createdAt: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';
  replyToId?: string;
  reactions?: MessageReaction[];
  reactionCounts?: Record<string, number>;
  isEdited?: boolean;
  editedAt?: string;
  deletedAt?: string;
}

// --- Call Service (Signaling/WebRTC) ---
export interface CallSession {
  id: string;
  conversationId: string;
  initiatorId: string;
  participants: string[];
  isActive: boolean;
  startTime: string;
  type: 'AUDIO' | 'VIDEO';
}

// --- Auth Types ---
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}
