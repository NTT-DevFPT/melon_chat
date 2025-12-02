import React from 'react';
import { ConversationItem } from './ConversationItem';
import { Conversation, User, UserStatus } from '../types';
import { ConversationListSkeleton } from './ConversationListSkeleton';

interface ConversationListProps {
  conversations: Conversation[];
  users: Record<string, User>;
  currentUserId: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  users,
  currentUserId,
  activeConversationId,
  onSelectConversation,
}) => {
  const getParticipantIds = (conv: Conversation) =>
    Array.isArray(conv.participants) ? conv.participants : [];

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'GROUP') return conv.name || 'Group';
    const otherUserId = getParticipantIds(conv).find(
      (id) => id !== currentUserId
    );
    return otherUserId
      ? users[otherUserId]?.fullName || users[otherUserId]?.username
      : 'Unknown User';
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'GROUP')
      return (
        conv.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name || 'G')}&background=FF6B9D&color=fff`
      );
    const otherUserId = getParticipantIds(conv).find(
      (id) => id !== currentUserId
    );
    return otherUserId
      ? users[otherUserId]?.avatarUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(users[otherUserId || '']?.fullName || 'U')}&background=random`;
  };

  const getOtherUserStatus = (conv: Conversation) => {
    if (conv.type === 'GROUP') return undefined;
    const otherUserId = getParticipantIds(conv).find(
      (id) => id !== currentUserId
    );
    return otherUserId ? users[otherUserId]?.status : UserStatus.OFFLINE;
  };

  if (conversations.length === 0) {
    return <ConversationListSkeleton count={5} />;
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {conversations.map((conv) => {
        const isActive = conv.id === activeConversationId;
        const name = getConversationName(conv);
        const avatar = getConversationAvatar(conv);
        const status = getOtherUserStatus(conv);

        // Format last message preview
        let lastMessagePreview = '';
        if (conv.unreadCount && conv.unreadCount > 1) {
          lastMessagePreview = `${conv.unreadCount} new messages`;
        } else if (conv.lastMessageContent) {
          const isMyMessage = conv.lastMessageSenderId === currentUserId;
          lastMessagePreview = isMyMessage
            ? `You: ${conv.lastMessageContent}`
            : conv.lastMessageContent;
        } else if (conv.unreadCount && conv.unreadCount === 1) {
          lastMessagePreview = 'New message received';
        } else {
          lastMessagePreview = 'Click to view conversation';
        }

        return (
          <ConversationItem
            key={conv.id}
            name={name}
            avatar={avatar!}
            lastMessage={lastMessagePreview}
            timestamp={
              conv.updatedAt
                ? new Date(conv.updatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''
            }
            unreadCount={conv.unreadCount}
            isActive={isActive}
            status={status}
            onClick={() => onSelectConversation(conv.id)}
          />
        );
      })}
    </div>
  );
};
