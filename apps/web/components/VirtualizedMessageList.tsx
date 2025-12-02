import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { List } from 'react-window';
import { MessageBubble } from './MessageBubble';
import { Message, User } from '../types';

interface VirtualizedMessageListProps {
  messages: Message[];
  currentUserId: string;
  users: Record<string, User>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onAddReaction?: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>;
  height?: number;
}

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    currentUserId: string;
    users: Record<string, User>;
    onDeleteMessage?: (messageId: string) => Promise<void>;
    onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
    onAddReaction?: (messageId: string, emoji: string) => Promise<void>;
    onRemoveReaction?: (messageId: string, emoji: string) => Promise<void>;
  };
}

const MessageItem: React.FC<MessageItemProps> = ({ index, style, data }) => {
  const {
    messages,
    currentUserId,
    users,
    onDeleteMessage,
    onEditMessage,
    onAddReaction,
    onRemoveReaction,
  } = data;
  const message = messages[index];

  if (!message) return null;

  const isMe = message.senderId === currentUserId;
  const showAvatar =
    !isMe && (index === 0 || messages[index - 1].senderId !== message.senderId);

  return (
    <div style={style} className="flex flex-col">
      <div className="px-6 py-2 flex-1 overflow-hidden">
        {/* Date separator for first message */}
        {index === 0 && (
          <div className="flex justify-center mb-4">
            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full">
              Today
            </span>
          </div>
        )}

        <MessageBubble
          message={message}
          isMe={isMe}
          sender={users[message.senderId]}
          showAvatar={showAvatar}
          currentUserId={currentUserId}
          onDelete={
            isMe && onDeleteMessage
              ? () => onDeleteMessage(message.id)
              : undefined
          }
          onEdit={
            isMe && onEditMessage
              ? (newContent) => onEditMessage(message.id, newContent)
              : undefined
          }
          onAddReaction={
            onAddReaction
              ? (emoji) => onAddReaction(message.id, emoji)
              : undefined
          }
          onRemoveReaction={
            onRemoveReaction
              ? (emoji) => onRemoveReaction(message.id, emoji)
              : undefined
          }
        />
      </div>
    </div>
  );
};

export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  currentUserId,
  users,
  onDeleteMessage,
  onEditMessage,
  onAddReaction,
  onRemoveReaction,
  height = 400,
}) => {
  const listRef = useRef<any>(null);

  // Use fixed item height for simplicity with react-window's List component
  const ITEM_HEIGHT = 120; // Fixed height per message item

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(
    () => ({
      messages,
      currentUserId,
      users,
      onDeleteMessage,
      onEditMessage,
      onAddReaction,
      onRemoveReaction,
    }),
    [
      messages,
      currentUserId,
      users,
      onDeleteMessage,
      onEditMessage,
      onAddReaction,
      onRemoveReaction,
    ]
  );

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/50 relative flex items-center justify-center">
        <span className="text-slate-400 text-sm">No messages yet</span>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-900/50 relative">
      <List
        ref={listRef}
        height={height}
        itemCount={messages.length}
        itemSize={ITEM_HEIGHT}
        itemData={itemData}
        overscanCount={5}
        className="scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
      >
        {MessageItem}
      </List>
    </div>
  );
};
