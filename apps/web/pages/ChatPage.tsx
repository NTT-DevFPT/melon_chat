import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  Suspense,
  lazy,
} from 'react';
import { Sidebar } from '../components/Sidebar';
import { ChatHeader } from '../components/ChatHeader';
import { VirtualizedMessageList } from '../components/VirtualizedMessageList';
import { ChatInput } from '../components/ChatInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { ChatHeaderSkeleton } from '../components/ChatHeaderSkeleton';
import { MessageListSkeleton } from '../components/MessageListSkeleton';
import { SkeletonLoader } from '../components/SkeletonLoader';

// Lazy load heavy components
const VideoCall = lazy(() =>
  import('../components/VideoCall').then((module) => ({
    default: module.VideoCall,
  }))
);
const SettingsModal = lazy(() =>
  import('../components/SettingsModal').then((module) => ({
    default: module.SettingsModal,
  }))
);
import { Paperclip, ChevronRight } from 'lucide-react';
import {
  Conversation,
  User,
  Message,
  UserStatus,
  ConversationType,
  MessageType,
} from '../types';
import { useAuthStore } from '../src/stores';
import { useTypingStore } from '../src/stores/typingStore';
import { toast } from 'react-hot-toast';
import { webSocketService } from '@/src/services/WebSocketService';
import { useFileUpload } from '@/src/hooks/useFileUpload';
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useDeleteMessage,
  useConversations,
  useCreateGroup,
  useCreateDirectConversation,
  useFriends,
  usePendingFriendRequests,
  useBlockedUsers,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useBlockUser,
  useUnblockUser,
  useCheckIfBlockedBy,
  useUser,
} from '../src/hooks/api';
import { useQueryClient } from '@tanstack/react-query';

export const ChatPage: React.FC = () => {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['privacy'])
  ); // Default expand privacy section

  const activeConvIdRef = useRef<string | null>(null);
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Typing store
  const { setTyping, getTypingUsers } = useTypingStore();
  const typingUserIds = activeConvId ? getTypingUsers(activeConvId) : [];

  // React Query hooks
  const { data: blockedUsers = [], isLoading: isLoadingBlockedUsers } =
    useBlockedUsers();
  const blockedUserIds = useMemo(
    () => new Set(blockedUsers.map((u) => u.id)),
    [blockedUsers]
  );

  const { data: conversations = [] } = useConversations(
    blockedUserIds,
    currentUser?.id
  );
  const { data: friends = [] } = useFriends();
  const { data: pendingRequests = [] } = usePendingFriendRequests();
  const { data: messages = [] } = useMessages(activeConvId);

  const sendMessageMutation = useSendMessage(activeConvId);
  const markAsReadMutation = useMarkAsRead(activeConvId);
  const deleteMessageMutation = useDeleteMessage();
  const createGroupMutation = useCreateGroup();
  const createDirectConversationMutation = useCreateDirectConversation();
  const acceptFriendRequestMutation = useAcceptFriendRequest();
  const rejectFriendRequestMutation = useRejectFriendRequest();
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  // Get active conversation details
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const participants = Array.isArray(activeConv?.participants)
    ? activeConv.participants
    : [];
  const otherId = participants.find((id) => id !== currentUser?.id);

  const { data: isBlockedByOther = false, isLoading: isCheckingBlocked } =
    useCheckIfBlockedBy(otherId || null);
  const { data: otherUser } = useUser(otherId || null);

  // Create users map for compatibility with existing code
  const users = useMemo(() => {
    const userMap: Record<string, User> = {};
    friends.forEach((user) => (userMap[user.id] = user));
    if (currentUser) userMap[currentUser.id] = currentUser;
    if (otherUser) userMap[otherUser.id] = otherUser;
    return userMap;
  }, [friends, currentUser, otherUser]);

  // Update ref when activeConvId changes
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // Set initial active conversation
  useEffect(() => {
    if (!activeConvId && conversations.length > 0 && conversations[0]) {
      setActiveConvId(conversations[0].id);
    }
  }, [activeConvId, conversations]);

  // WebSocket Integration with React Query
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    webSocketService.connect(token, () => {
      webSocketService.subscribe(
        '/user/queue/messages',
        async (message: Message) => {
          const isActive = activeConvIdRef.current === message.conversationId;

          // Handle new message - update React Query cache
          if (isActive) {
            // Add message to cache optimistically
            queryClient.setQueryData<Message[]>(
              ['messages', message.conversationId],
              (old = []) => [...old, message]
            );

            // Mark as read immediately if in active room
            try {
              if (markAsReadMutation.mutateAsync) {
                await markAsReadMutation.mutateAsync();
              }
            } catch (err) {
              console.error('Failed to mark as read', err);
            }
          }

          // Invalidate conversations to update last message and unread count
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      );
    });

    return () => {
      webSocketService.disconnect();
    };
  }, [currentUser, markAsReadMutation]);

  // Subscribe to typing indicators for active conversation
  useEffect(() => {
    if (!activeConvId || !webSocketService.isConnected()) return;

    webSocketService.subscribeToTyping(activeConvId, (event: any) => {
      if (event.userId !== currentUser?.id) {
        if (event.isTyping) {
          setTyping(activeConvId, event.userId, event.username || 'User');
        }
      }
    });

    return () => {
      webSocketService.unsubscribeFromTyping(activeConvId);
    };
  }, [activeConvId, currentUser?.id, setTyping]);

  // Mark conversation as read when entering the room
  useEffect(() => {
    if (!activeConvId) return;

    const markAsRead = async () => {
      try {
        await markAsReadMutation.mutateAsync();
      } catch (error) {
        console.error('Failed to mark as read', error);
      }
    };
    markAsRead();
  }, [activeConvId, markAsReadMutation]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConvId) return;

    try {
      await sendMessageMutation.mutateAsync({
        content: inputValue,
        type: MessageType.TEXT,
      });
      setInputValue('');
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

      await sendMessageMutation.mutateAsync({
        content: file.name || 'Attachment',
        type: type,
        attachmentUrl: publicUrl,
        attachmentName: file.name,
        attachmentSize: file.size,
      });
    } catch (error) {
      console.error('Failed to send file message', error);
      toast.error('Failed to send file');
    } finally {
      // Clear the file input
      e.target.value = '';
    }
  };

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    try {
      await createGroupMutation.mutateAsync({ name, participantIds });
      toast.success('Group created!');
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
      const newConversation =
        await createDirectConversationMutation.mutateAsync(friendId);
      if (newConversation?.id) {
        setActiveConvId(newConversation.id);
        toast.success('New chat room created');
      } else {
        // Fallback: find the conversation in the updated list
        const created = findDirectConversation(conversations, friendId);
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
      await acceptFriendRequestMutation.mutateAsync(friendshipId);
      toast.success('Friend request accepted');
    } catch (error) {
      console.error('Failed to accept friend request', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      await rejectFriendRequestMutation.mutateAsync(friendshipId);
      toast.success('Friend request rejected');
    } catch (error) {
      console.error('Failed to reject friend request', error);
      toast.error('Failed to reject request');
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const { reactionApi } = await import('../src/api/reactions');
      await reactionApi.addReaction(messageId, emoji);

      // Invalidate messages query to refetch with updated reactions
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvId] });
    } catch (error: any) {
      console.error('Failed to add reaction', error);
      if (error.response?.status === 409) {
        toast.error('You already reacted with this emoji');
      } else {
        toast.error('Failed to add reaction');
      }
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      const { reactionApi } = await import('../src/api/reactions');
      await reactionApi.removeReaction(messageId, emoji);

      // Invalidate messages query to refetch with updated reactions
      queryClient.invalidateQueries({ queryKey: ['messages', activeConvId] });
    } catch (error) {
      console.error('Failed to remove reaction', error);
      toast.error('Failed to remove reaction');
    }
  };

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

            <VirtualizedMessageList
              messages={messages}
              currentUserId={currentUser?.id || ''}
              users={users}
              height={window.innerHeight - 200} // Adjust based on header and input heights
              onDeleteMessage={async (messageId: string) => {
                try {
                  await deleteMessageMutation.mutateAsync(messageId);
                  toast.success('Message deleted');
                } catch (error) {
                  console.error('Failed to delete message', error);
                  toast.error('Failed to delete message');
                }
              }}
              onEditMessage={async (messageId: string, newContent: string) => {
                try {
                  const { editMessage } = await import('../src/api/messages');
                  await editMessage(messageId, newContent);

                  // Invalidate messages query to refetch with updated message
                  queryClient.invalidateQueries({
                    queryKey: ['messages', activeConvId],
                  });
                  toast.success('Message edited');
                } catch (error: any) {
                  console.error('Failed to edit message', error);
                  if (error.response?.status === 401) {
                    toast.error(
                      'Cannot edit this message (either not yours, deleted, or past 15-minute edit window)'
                    );
                  } else {
                    toast.error('Failed to edit message');
                  }
                }
              }}
              onAddReaction={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
            />

            {/* Typing Indicator */}
            {typingUserIds.length > 0 && (
              <TypingIndicator
                usernames={typingUserIds.map(
                  (id) => users[id]?.fullName || users[id]?.username || 'User'
                )}
              />
            )}

            {/* Input Area - Hidden when blocked by other user or while checking */}
            {!isBlockedByOther && !isCheckingBlocked && (
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
                conversationId={activeConvId}
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
        {isCallOpen && (
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <SkeletonLoader width="400px" height="300px" />
              </div>
            }
          >
            <VideoCall
              isOpen={isCallOpen}
              onClose={() => setIsCallOpen(false)}
              peerName={headerInfo.title}
              peerAvatar={headerInfo.avatar}
            />
          </Suspense>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-900 rounded-lg p-6">
                <SkeletonLoader width="400px" height="300px" />
              </div>
            </div>
          }
        >
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            blockedUsers={blockedUsers}
            onUnblock={async (userId: string) => {
              try {
                await unblockUserMutation.mutateAsync(userId);
                toast.success('User unblocked successfully');
              } catch (error) {
                console.error('Failed to unblock user', error);
                toast.error('Failed to unblock user');
              }
            }}
          />
        </Suspense>
      )}

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
                            if (!otherId) return;

                            if (
                              !confirm(
                                "Are you sure you want to block this user? This will unfriend them and they won't be able to find you."
                              )
                            ) {
                              return;
                            }

                            try {
                              await blockUserMutation.mutateAsync(otherId);
                              toast.success('User blocked successfully');

                              // Close the conversation if it's the blocked user
                              if (
                                activeConvId &&
                                activeConv &&
                                activeConvId === activeConv.id
                              ) {
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
