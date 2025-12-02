import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatHeader } from '../components/ChatHeader';
import { ChatMessageList } from '../components/ChatMessageList';
import { ChatInput } from '../components/ChatInput';
import { VideoCall } from '../components/VideoCall';
import { SettingsModal } from '../components/SettingsModal';
import { ChatHeaderSkeleton } from '../components/ChatHeaderSkeleton';
import { MessageListSkeleton } from '../components/MessageListSkeleton';
import { Paperclip, ChevronRight } from 'lucide-react';
import {
  Conversation,
  User,
  Message,
  UserStatus,
  ConversationType,
  MessageType,
  PendingFriendRequest,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { client } from '@/src/api/client';
import { toast } from 'react-hot-toast';
import { webSocketService } from '@/src/services/WebSocketService';
import { useFileUpload } from '@/src/hooks/useFileUpload';

export const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<
    PendingFriendRequest[]
  >([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['privacy'])
  ); // Default expand privacy section
  const [isBlockedByOther, setIsBlockedByOther] = useState<boolean>(false);
  const [isCheckingBlocked, setIsCheckingBlocked] = useState<boolean>(false);
  const [blockedStatusCache, setBlockedStatusCache] = useState<
    Record<string, boolean>
  >({});
  const [isLoadingBlockedUsers, setIsLoadingBlockedUsers] =
    useState<boolean>(true);

  const activeConvIdRef = useRef<string | null>(null);

  const { user: currentUser } = useAuth();

  // Update ref when activeConvId changes
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // WebSocket Integration
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    webSocketService.connect(token, () => {
      webSocketService.subscribe(
        '/user/queue/messages',
        async (message: Message) => {
          const isActive = activeConvIdRef.current === message.conversationId;

          // Handle new message
          if (isActive) {
            setMessages((prev) => [...prev, message]);
            // Mark as read immediately if in active room (user is viewing, so automatically read)
            try {
              await client.post(`/chats/${message.conversationId}/read`);
              // Refresh conversations to sync with backend after marking as read
              setTimeout(() => loadConversations(), 300);
            } catch (err) {
              console.error('Failed to mark as read', err);
            }
          }

          // Update conversations list
          setConversations((prev) => {
            const index = prev.findIndex(
              (c) => c.id === message.conversationId
            );
            if (index !== -1) {
              const current = prev[index];
              // If active room, unreadCount is always 0 (user is viewing)
              // If not active, increment unreadCount only if message is from others
              const isMyMessage = message.senderId === currentUser?.id;
              const unreadBase = current.unreadCount ?? 0;
              const updatedConv: Conversation = {
                ...current,
                updatedAt: message.createdAt,
                lastMessageId: message.id,
                lastMessageContent: message.content,
                lastMessageSenderId: message.senderId,
                lastMessageAt: message.createdAt,
                unreadCount: isActive ? 0 : isMyMessage ? 0 : unreadBase + 1,
              };
              const newConvs = [...prev];
              newConvs.splice(index, 1);
              newConvs.unshift(updatedConv);
              return newConvs;
            }
            // If new conversation, we might want to fetch it. For now, just ignore or trigger a refetch.
            return prev;
          });
        }
      );
    });

    return () => {
      webSocketService.disconnect();
    };
  }, [currentUser]);

  const loadBlockedUsers = useCallback(
    async (showLoading = true) => {
      if (!currentUser) {
        setIsLoadingBlockedUsers(false);
        return;
      }
      try {
        if (showLoading) setIsLoadingBlockedUsers(true);
        const response = await client.get<User[]>('/friendships/blocked');
        setBlockedUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch blocked users', error);
      } finally {
        if (showLoading) setIsLoadingBlockedUsers(false);
      }
    },
    [currentUser]
  );

  const loadConversations = useCallback(async () => {
    try {
      const response = await client.get<Conversation[]>('/chats');
      // Trust backend unreadCount - only override for active room if we're currently viewing it
      const updated = response.data.map((conv) => {
        // If this is the active room and we're viewing it, ensure unreadCount = 0
        // Otherwise, trust backend value
        if (conv.id === activeConvId && activeConvId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });

      // Filter out conversations with users that current user has blocked (only for DIRECT conversations)
      // User A blocks User B -> User A won't see conversation with User B
      // ALWAYS filter based on current blockedUsers state to prevent flash
      const blockedUserIds = new Set(blockedUsers.map((u) => u.id));
      const filtered = updated.filter((conv) => {
        if (conv.type === ConversationType.DIRECT) {
          const participants = Array.isArray(conv.participants)
            ? conv.participants
            : [];
          const otherId = participants.find((id) => id !== currentUser?.id);
          if (!otherId) return true;

          // Always filter out blocked users, even on initial load
          // This prevents the flash of blocked conversations appearing then disappearing
          return !blockedUserIds.has(otherId);
        }
        return true; // Keep all GROUP conversations
      });

      setConversations(filtered);
      setActiveConvId((prev) => prev ?? filtered[0]?.id ?? null);
      return filtered;
    } catch (error) {
      console.error('Failed to fetch conversations', error);
      return [];
    }
  }, [activeConvId, blockedUsers, currentUser]);

  // Load blocked users first, then conversations on initial load
  useEffect(() => {
    const initData = async () => {
      if (!currentUser) {
        setIsLoadingBlockedUsers(false);
        return;
      }

      // Load blocked users first
      let loadedBlockedUsers: User[] = [];
      try {
        setIsLoadingBlockedUsers(true);
        const blockedResponse = await client.get<User[]>(
          '/friendships/blocked'
        );
        setBlockedUsers(blockedResponse.data);
        loadedBlockedUsers = blockedResponse.data;
      } catch (error) {
        console.error('Failed to fetch blocked users', error);
      } finally {
        setIsLoadingBlockedUsers(false);
      }

      // Then load conversations (which will filter based on freshly loaded blocked users)
      try {
        const response = await client.get<Conversation[]>('/chats');
        const updated = response.data.map((conv) => {
          if (conv.id === activeConvId && activeConvId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        });

        const blockedUserIds = new Set(loadedBlockedUsers.map((u) => u.id));
        const filtered = updated.filter((conv) => {
          if (conv.type === ConversationType.DIRECT) {
            const participants = Array.isArray(conv.participants)
              ? conv.participants
              : [];
            const otherId = participants.find((id) => id !== currentUser?.id);
            if (!otherId) return true;
            return !blockedUserIds.has(otherId);
          }
          return true;
        });

        setConversations(filtered);
        setActiveConvId((prev) => prev ?? filtered[0]?.id ?? null);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
      }
    };
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // Only depend on currentUser.id, not the whole object

  // Auto-refresh conversations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Remove redundant visibility listener here (it was causing double fetches)
  // The main visibility listener below handles everything

  const normalizeMessages = (payload: { content?: Message[] } | Message[]) => {
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? [];
  };

  const MESSAGE_POLL_INTERVAL_MS = 1200;

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await client.get<{ content?: Message[] } | Message[]>(
        `/chats/${conversationId}/messages`
      );
      setMessages([...normalizeMessages(response.data)].reverse());
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  }, []);

  const fetchRecentMessages = useCallback(
    async (conversationId: string) => {
      try {
        const last = messages[messages.length - 1];
        if (!last) {
          await fetchMessages(conversationId);
          return;
        }
        const response = await client.get<Message[]>(
          `/chats/${conversationId}/messages/recent`,
          {
            params: { since: last.createdAt },
          }
        );
        if (response.data.length) {
          setMessages((prev) => [...prev, ...response.data]);
          // If this is the active room, mark as read (user is viewing, so automatically read)
          if (activeConvIdRef.current === conversationId) {
            try {
              await client.post(`/chats/${conversationId}/read`);
              // Refresh conversations to sync with backend
              setTimeout(() => loadConversations(), 300);
            } catch (err) {
              console.error('Failed to mark as read', err);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch recent messages', error);
      }
    },
    [messages, fetchMessages, loadConversations]
  );

  // Fetch messages for active conversation and mark as read
  useEffect(() => {
    if (!activeConvId) return;
    fetchMessages(activeConvId);

    // Mark conversation as read when entering the room (call backend)
    const markAsRead = async () => {
      try {
        await client.post(`/chats/${activeConvId}/read`);
        // Refresh conversations to sync with backend after marking as read
        // This ensures lastReadAt is updated and unreadCount is correct
        setTimeout(() => loadConversations(), 300);
      } catch (error) {
        console.error('Failed to mark as read', error);
      }
    };
    markAsRead();

    // Update UI immediately (optimistic update)
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConvId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, [activeConvId, fetchMessages, loadConversations]);

  // Poll only recent messages to keep near-realtime with minimal payload
  useEffect(() => {
    if (!activeConvId) return;
    const interval = setInterval(
      () => fetchRecentMessages(activeConvId),
      MESSAGE_POLL_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, [activeConvId, fetchRecentMessages]);

  const loadFriends = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await client.get<User[]>('/friendships');
      setUsers((prev) => {
        const newUsers = { ...prev };
        response.data.forEach((u) => (newUsers[u.id] = u));
        if (currentUser) newUsers[currentUser.id] = currentUser;
        return newUsers;
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  }, [currentUser]);

  const loadPendingRequests = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await client.get<PendingFriendRequest[]>(
        '/friendships/requests'
      );
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch pending requests', error);
    }
  }, [currentUser]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    loadPendingRequests();
  }, [loadPendingRequests]);

  // Load blocked users periodically (initial load is handled in initData above)
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        loadBlockedUsers(false); // Silent refresh
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser, loadBlockedUsers]);

  // Presence polling for friends
  useEffect(() => {
    const interval = setInterval(() => {
      loadFriends();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadFriends]);

  // Auto-refresh pending requests periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadPendingRequests();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [loadPendingRequests]);

  // Refresh all data when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadFriends();
        loadPendingRequests();
        loadBlockedUsers(false); // Silent refresh
        loadConversations();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadFriends, loadPendingRequests, loadBlockedUsers, loadConversations]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConvId) return;

    try {
      const response = await client.post<Message>(
        `/chats/${activeConvId}/messages`,
        {
          content: inputValue,
          type: MessageType.TEXT,
        }
      );
      setInputValue('');
      // Refresh messages immediately (or wait for WebSocket)
      // Waiting for WebSocket is better for consistency, but immediate feedback is nice.
      // Let's rely on WebSocket for the incoming message, but we can optimistically add it if we want.
      // For now, let's just fetch messages to be sure, or rely on WS.
      // Actually, if we rely on WS, we don't need to fetch.
      // But let's fetch just in case WS is slow or disconnected.
      if (response.data) {
        setMessages((prev) => [...prev, response.data]);
        // Update conversation immediately
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConvId
              ? {
                  ...conv,
                  updatedAt: response.data.createdAt,
                  lastMessageId: response.data.id,
                  lastMessageContent: response.data.content,
                  lastMessageSenderId: response.data.senderId,
                  lastMessageAt: response.data.createdAt,
                  unreadCount: 0, // Mark as read since we're in the room
                }
              : conv
          )
        );
        // Refresh conversations to sync with backend
        setTimeout(() => loadConversations(), 500);
      } else {
        await fetchMessages(activeConvId);
      }
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('Failed to send message');
    }
  };

  const { uploadFile, isUploading } = useFileUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;

    let type = MessageType.FILE;
    if (file.type.startsWith('image/')) type = MessageType.IMAGE;
    else if (file.type.startsWith('video/')) type = MessageType.VIDEO;

    try {
      const publicUrl = await uploadFile(file, activeConvId);
      if (!publicUrl) return;

      const response = await client.post<Message>(
        `/chats/${activeConvId}/messages`,
        {
          content: file.name || 'Attachment',
          type: type,
          attachmentUrl: publicUrl,
          attachmentName: file.name,
          attachmentSize: file.size,
        }
      );

      if (response.data) {
        setMessages((prev) => [...prev, response.data]);
        // Update conversation immediately
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConvId
              ? {
                  ...conv,
                  updatedAt: response.data.createdAt,
                  lastMessageId: response.data.id,
                  lastMessageContent:
                    type === MessageType.IMAGE
                      ? 'Sent an image'
                      : type === MessageType.VIDEO
                        ? 'Sent a video'
                        : 'Sent a file',
                  lastMessageSenderId: response.data.senderId,
                  lastMessageAt: response.data.createdAt,
                  unreadCount: 0,
                }
              : conv
          )
        );
        setTimeout(() => loadConversations(), 500);
      }
    } catch (error) {
      console.error('Failed to send file message', error);
      toast.error('Failed to send file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    try {
      await client.post('/chats/group', {
        name,
        participantIds,
      });
      toast.success('Group created!');
      await loadConversations();
    } catch (error) {
      console.error('Failed to create group', error);
      toast.error('Failed to create group');
    }
  };

  const findDirectConversation = (list: Conversation[], friendId: string) =>
    list.find(
      (conv) =>
        conv.type === ConversationType.DIRECT &&
        Array.isArray(conv.participants) &&
        conv.participants.includes(friendId)
    );

  const handleOpenFriendConversation = async (friendId: string) => {
    const existing = findDirectConversation(conversations, friendId);
    if (existing) {
      setActiveConvId(existing.id);
      return;
    }
    try {
      const response = await client.post<Conversation>(
        `/chats/direct/${friendId}`
      );
      await loadConversations();
      if (response.data?.id) {
        setActiveConvId(response.data.id);
        toast.success('New chat room created');
      } else {
        const updated = await loadConversations();
        const created = findDirectConversation(updated, friendId);
        if (created) {
          setActiveConvId(created.id);
          toast.success('New chat room created');
        } else {
          toast.error('Chat created but not found, try refreshing.');
        }
      }
    } catch (error) {
      console.error('Failed to open chat', error);
      toast.error('Cannot start chat with user');
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      await client.put(`/friendships/${friendshipId}/accept`);
      toast.success('Friend request accepted');
      // Auto-refresh all data
      await Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadConversations(),
      ]);
    } catch (error) {
      console.error('Failed to accept friend request', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      await client.put(`/friendships/${friendshipId}/reject`);
      toast.success('Friend request rejected');
      // Auto-refresh pending requests
      await loadPendingRequests();
    } catch (error) {
      console.error('Failed to reject friend request', error);
      toast.error('Failed to reject request');
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Calculate otherId outside useEffect to use as stable dependency
  const participants = Array.isArray(activeConv?.participants)
    ? activeConv.participants
    : [];
  const otherId = participants.find((id) => id !== currentUser?.id);

  // Reset blocked status when conversation changes
  useEffect(() => {
    setIsBlockedByOther(false);
    setIsCheckingBlocked(true); // Default to checking to prevent flash of input area
  }, [activeConvId]);

  // Check if current user is blocked by the other user and load other user info
  useEffect(() => {
    const checkIfBlockedByOtherAndLoadUser = async () => {
      if (
        !activeConvId ||
        !activeConv ||
        activeConv.type !== ConversationType.DIRECT ||
        !currentUser ||
        !otherId
      ) {
        setIsBlockedByOther(false);
        setIsCheckingBlocked(false);
        return;
      }

      // Check cache first - if we already know the blocked status for this conversation, use it
      const cacheKey = `${activeConvId}-${otherId}`;
      if (blockedStatusCache[cacheKey] !== undefined) {
        setIsBlockedByOther(blockedStatusCache[cacheKey]);
        setIsCheckingBlocked(false);
        // Still load user info if not already loaded
        if (!users[otherId]) {
          try {
            const userResponse = await client.get<User>(`/users/${otherId}`);
            setUsers((prev) => ({
              ...prev,
              [otherId]: userResponse.data,
            }));
          } catch (error) {
            console.error('Failed to load other user info', error);
          }
        }
        return;
      }

      // Set checking state to prevent showing input area prematurely
      setIsCheckingBlocked(true);

      try {
        // Check if blocked by other user - do this first and in parallel with loading user info
        const [blockedResponse, userResponse] = await Promise.all([
          client.get<boolean>(`/friendships/blocked-by/${otherId}`),
          // Load other user info even if blocked (so we can display their name and avatar)
          // This is important: User B should still see User A's info even if User A blocked User B
          users[otherId]
            ? Promise.resolve({ data: users[otherId] })
            : client
                .get<User>(`/users/${otherId}`)
                .catch(() => ({ data: null })),
        ]);

        const isBlocked = blockedResponse.data;
        setIsBlockedByOther(isBlocked);

        // Cache the blocked status for this conversation
        setBlockedStatusCache((prev) => ({
          ...prev,
          [cacheKey]: isBlocked,
        }));

        // Update user info if loaded
        if (userResponse.data && !users[otherId]) {
          setUsers((prev) => ({
            ...prev,
            [otherId]: userResponse.data,
          }));
        }
      } catch (error) {
        console.error('Failed to check if blocked by other', error);
        setIsBlockedByOther(false);
        // Cache false if check fails
        setBlockedStatusCache((prev) => ({
          ...prev,
          [cacheKey]: false,
        }));
      } finally {
        setIsCheckingBlocked(false);
      }
    };

    checkIfBlockedByOtherAndLoadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, otherId, currentUser?.id]); // Only depend on stable IDs

  // Helper to get chat header info
  const getHeaderInfo = () => {
    if (!activeConv) return { title: 'Select Chat', subtitle: '', avatar: '' };

    if (activeConv.type === ConversationType.GROUP) {
      const participantCount = Array.isArray(activeConv.participants)
        ? activeConv.participants.length
        : 0;
      return {
        title: activeConv.name || 'Group Chat',
        subtitle: `${participantCount} participants`,
        avatar:
          activeConv.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConv.name || 'G')}&background=FF6B9D&color=fff`,
      };
    } else {
      const participants = Array.isArray(activeConv.participants)
        ? activeConv.participants
        : [];
      const otherId = participants.find((id) => id !== currentUser?.id);
      // Try to find user in our map, otherwise fallback to unknown
      const user = users[otherId || ''];
      return {
        title: user?.fullName || 'Unknown',
        subtitle: user?.status === UserStatus.ONLINE ? 'Online' : 'Offline',
        avatar:
          user?.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=random`,
      };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Watermelon Seed Particles Background */}
      <div className="watermelon-seeds">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="seed" />
        ))}
      </div>

      <Sidebar
        conversations={isLoadingBlockedUsers ? [] : conversations}
        users={users}
        friends={friends}
        pendingRequests={pendingRequests}
        currentUserId={currentUser?.id || ''}
        activeConversationId={activeConvId}
        onSelectConversation={setActiveConvId}
        onCreateGroup={handleCreateGroup}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFriendChat={handleOpenFriendConversation}
        onAcceptFriendRequest={handleAcceptFriendRequest}
        onRejectFriendRequest={handleRejectFriendRequest}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900 relative">
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-center p-8 z-10">
            <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-2xl border border-slate-800 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src="/logo.png"
                alt="Logo"
                className="w-20 h-20 relative z-10"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Welcome to Melon <span style={{ color: '#FF6B9D' }}>Chat</span> 🍉
            </h2>
            <p className="text-slate-400 max-w-md text-lg leading-relaxed">
              Select a conversation from the sidebar or start a new one to begin
              messaging.
            </p>
          </div>
        ) : activeConv?.type === ConversationType.DIRECT &&
          otherId &&
          !users[otherId] ? (
          <div className="flex-1 flex flex-col bg-slate-900">
            <ChatHeaderSkeleton />
            <MessageListSkeleton />
          </div>
        ) : (
          <>
            <ChatHeader
              title={headerInfo.title}
              subtitle={headerInfo.subtitle}
              avatar={headerInfo.avatar}
              conversationType={activeConv?.type}
              onPhoneCall={() => setIsCallOpen(true)}
              onVideoCall={() => setIsCallOpen(true)}
              onToggleInfo={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              isInfoOpen={isRightSidebarOpen}
            />

            <ChatMessageList
              messages={messages}
              currentUserId={currentUser?.id || ''}
              users={users}
              onDeleteMessage={async (messageId: string) => {
                try {
                  await client.delete(`/chats/messages/${messageId}`);
                  setMessages((prev) => prev.filter((m) => m.id !== messageId));
                  setTimeout(() => loadConversations(), 300);
                  toast.success('Message deleted');
                } catch (error) {
                  console.error('Failed to delete message', error);
                  toast.error('Failed to delete message');
                }
              }}
            />

            {/* Input Area - Hidden when blocked by other user or while checking */}
            {!isBlockedByOther && !isCheckingBlocked && (
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
              />
            )}

            {/* Blocked Message Notice - Replaces input area when blocked or while checking */}
            {(isBlockedByOther || isCheckingBlocked) && (
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-center m-0 min-h-[60px]">
                {isCheckingBlocked ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400">Đang kiểm tra...</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 font-medium text-center">
                    Bạn không thể tiếp tục trò chuyện với người này
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Video Call Overlay */}
        <VideoCall
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
          peerName={headerInfo.title}
          peerAvatar={headerInfo.avatar}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        blockedUsers={blockedUsers}
        onUnblock={async (userId: string) => {
          try {
            await client.delete(`/friendships/block/${userId}`);
            toast.success('User unblocked successfully');

            // Clear blocked status cache for all conversations with this user
            setBlockedStatusCache((prev) => {
              const newCache = { ...prev };
              Object.keys(newCache).forEach((key) => {
                if (key.endsWith(`-${userId}`)) {
                  delete newCache[key];
                }
              });
              return newCache;
            });

            await Promise.all([
              loadBlockedUsers(),
              loadFriends(),
              loadPendingRequests(),
              loadConversations(),
            ]);
          } catch (error) {
            console.error('Failed to unblock user', error);
            toast.error('Failed to unblock user');
          }
        }}
      />

      {/* Optional Right Sidebar (Details) - Toggleable */}
      {activeConvId && isRightSidebarOpen && (
        <div className="hidden lg:block w-80 border-l border-slate-800 bg-slate-900 flex flex-col">
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Profile Section */}
            <div className="flex flex-col items-center mb-6">
              <img
                src={headerInfo.avatar}
                className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-slate-800 shadow-lg"
                alt="Profile"
              />
              <h3 className="text-lg font-bold text-slate-100">
                {headerInfo.title}
              </h3>
              <p className="text-sm text-slate-400">{headerInfo.subtitle}</p>
            </div>

            {/* Main Sections with Dropdown */}
            <div className="space-y-1">
              {/* 1. Thông tin về đoạn chat */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedSections);
                    if (newExpanded.has('info')) {
                      newExpanded.delete('info');
                    } else {
                      newExpanded.add('info');
                    }
                    setExpandedSections(newExpanded);
                  }}
                  className="w-full flex items-center justify-between py-3 px-4 text-sm text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <span>Thông tin về đoạn chat</span>
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${expandedSections.has('info') ? 'rotate-90' : ''}`}
                  />
                </button>
                {expandedSections.has('info') && (
                  <div className="ml-4 mt-2 space-y-1 border-l-2 border-slate-700 pl-4">
                    <div className="text-xs text-slate-400 py-2">
                      {activeConv?.type === ConversationType.GROUP ? (
                        <>
                          <p className="text-slate-300 mb-1">
                            Group: {activeConv.name}
                          </p>
                          <p className="text-slate-400">
                            {Array.isArray(activeConv.participants)
                              ? activeConv.participants.length
                              : 0}{' '}
                            participants
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-slate-300 mb-1">Direct Chat</p>
                          <p className="text-slate-400">
                            One-on-one conversation
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Tùy chỉnh đoạn chat */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedSections);
                    if (newExpanded.has('customize')) {
                      newExpanded.delete('customize');
                    } else {
                      newExpanded.add('customize');
                    }
                    setExpandedSections(newExpanded);
                  }}
                  className="w-full flex items-center justify-between py-3 px-4 text-sm text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <span>Tùy chỉnh đoạn chat</span>
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${expandedSections.has('customize') ? 'rotate-90' : ''}`}
                  />
                </button>
                {expandedSections.has('customize') && (
                  <div className="ml-4 mt-2 space-y-1 border-l-2 border-slate-700 pl-4">
                    <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors">
                      Change Theme
                    </button>
                    <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors">
                      Change Wallpaper
                    </button>
                    <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors">
                      Font Size
                    </button>
                  </div>
                )}
              </div>

              {/* 3. File phương tiện & file */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedSections);
                    if (newExpanded.has('media')) {
                      newExpanded.delete('media');
                    } else {
                      newExpanded.add('media');
                    }
                    setExpandedSections(newExpanded);
                  }}
                  className="w-full flex items-center justify-between py-3 px-4 text-sm text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <span>File phương tiện & file</span>
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${expandedSections.has('media') ? 'rotate-90' : ''}`}
                  />
                </button>
                {expandedSections.has('media') && (
                  <div className="ml-4 mt-2 space-y-4 border-l-2 border-slate-700 pl-4">
                    {/* Images */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-300 font-medium">
                          Images
                        </span>
                        <span className="text-xs text-slate-500">
                          {
                            messages.filter(
                              (m) =>
                                m.type === MessageType.IMAGE ||
                                m.attachments?.some((a) => a.type === 'IMAGE')
                            ).length
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {messages
                          .filter(
                            (m) =>
                              m.type === MessageType.IMAGE ||
                              m.attachments?.some((a) => a.type === 'IMAGE')
                          )
                          .slice(0, 9)
                          .map((message) => {
                            const imageUrl =
                              message.attachments?.find(
                                (a) => a.type === 'IMAGE'
                              )?.url || message.content;
                            return (
                              <div
                                key={message.id}
                                className="aspect-square rounded-lg overflow-hidden bg-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={imageUrl}
                                  alt="Media"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Files */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-300 font-medium">
                          Files
                        </span>
                        <span className="text-xs text-slate-500">
                          {
                            messages.filter(
                              (m) =>
                                m.type === MessageType.FILE ||
                                m.attachments?.some((a) => a.type === 'FILE')
                            ).length
                          }
                        </span>
                      </div>
                      <div className="space-y-2">
                        {messages
                          .filter(
                            (m) =>
                              m.type === MessageType.FILE ||
                              m.attachments?.some((a) => a.type === 'FILE')
                          )
                          .slice(0, 5)
                          .map((message) => {
                            const file = message.attachments?.find(
                              (a) => a.type === 'FILE'
                            );
                            return (
                              <div
                                key={message.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                              >
                                <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
                                  <Paperclip
                                    size={16}
                                    className="text-slate-400"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-200 truncate">
                                    {file?.name || 'File'}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {file?.size
                                      ? `${(file.size / 1024).toFixed(1)} KB`
                                      : 'Unknown size'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Quyền riêng tư và hỗ trợ */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedSections);
                    if (newExpanded.has('privacy')) {
                      newExpanded.delete('privacy');
                    } else {
                      newExpanded.add('privacy');
                    }
                    setExpandedSections(newExpanded);
                  }}
                  className="w-full flex items-center justify-between py-3 px-4 text-sm text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <span>Quyền riêng tư và hỗ trợ</span>
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${expandedSections.has('privacy') ? 'rotate-90' : ''}`}
                  />
                </button>
                {expandedSections.has('privacy') && (
                  <div className="ml-4 mt-2 space-y-1 border-l-2 border-slate-700 pl-4">
                    {activeConv?.type === ConversationType.DIRECT ? (
                      <>
                        <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <span>🔔</span>
                          Tắt thông báo
                        </button>
                        <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <span>🔒</span>
                          Quyền nhắn tin
                        </button>
                        <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <span>⏰</span>
                          Tin nhắn tự hủy
                        </button>
                        <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <span>👁️</span>
                          Thông báo đã đọc
                          <span className="ml-auto text-xs text-slate-500">
                            Bật
                          </span>
                        </button>
                        <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <span>🔐</span>
                          Xác minh mã hóa đầu cuối
                        </button>
                        <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <span>🚫</span>
                          Hạn chế
                        </button>
                        <button
                          onClick={async () => {
                            const participants = Array.isArray(
                              activeConv.participants
                            )
                              ? activeConv.participants
                              : [];
                            const otherId = participants.find(
                              (id) => id !== currentUser?.id
                            );
                            if (!otherId) return;

                            if (
                              !confirm(
                                "Are you sure you want to block this user? This will unfriend them and they won't be able to find you."
                              )
                            ) {
                              return;
                            }

                            try {
                              // First unfriend if they are friends
                              try {
                                await client.delete(`/friendships/${otherId}`);
                              } catch (e) {
                                // Ignore if not friends
                              }
                              // Then block
                              await client.post(
                                `/friendships/block/${otherId}`
                              );
                              toast.success('User blocked successfully');

                              // Clear blocked status cache for this conversation
                              const cacheKey = `${activeConv.id}-${otherId}`;
                              setBlockedStatusCache((prev) => {
                                const newCache = { ...prev };
                                delete newCache[cacheKey];
                                return newCache;
                              });

                              await Promise.all([
                                loadBlockedUsers(),
                                loadFriends(),
                                loadPendingRequests(),
                                loadConversations(),
                              ]);
                              // Close the conversation if it's the blocked user
                              if (activeConvId === activeConv.id) {
                                setActiveConvId(null);
                              }
                            } catch (error) {
                              console.error('Failed to block user', error);
                              toast.error('Failed to block user');
                            }
                          }}
                          className="w-full text-left text-xs text-red-400 hover:text-red-300 py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <span>🚫</span>
                          Chặn
                        </button>
                        <button
                          onClick={async () => {
                            const participants = Array.isArray(
                              activeConv.participants
                            )
                              ? activeConv.participants
                              : [];
                            const otherId = participants.find(
                              (id) => id !== currentUser?.id
                            );
                            if (!otherId) return;

                            if (
                              !confirm(
                                'Are you sure you want to report this conversation?'
                              )
                            ) {
                              return;
                            }

                            toast('Report feature coming soon', { icon: 'ℹ️' });
                          }}
                          className="w-full text-left text-xs text-orange-400 hover:text-orange-300 py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <span>⚠️</span>
                          Báo cáo
                          <span className="ml-auto text-[10px] text-slate-500">
                            Đóng góp ý kiến và báo cáo cuộc trò chuyện
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <span>🔔</span>
                          Tắt thông báo
                        </button>
                        <button className="w-full text-left text-xs text-slate-300 hover:text-white py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center gap-2">
                          <span>👁️</span>
                          Thông báo đã đọc
                          <span className="ml-auto text-xs text-slate-500">
                            Bật
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
