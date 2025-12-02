import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message, User } from '../types';

interface ChatMessageListProps {
  messages: Message[];
  currentUserId: string;
  users: Record<string, User>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUserId,
  users,
  onDeleteMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/50 relative">
      <div className="flex justify-center mb-4">
        <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full">
          Today
        </span>
      </div>

      {messages.map((msg, index) => {
        const isMe = msg.senderId === currentUserId;
        const showAvatar =
          !isMe &&
          (index === 0 || messages[index - 1].senderId !== msg.senderId);
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMe={isMe}
            sender={users[msg.senderId]}
            showAvatar={showAvatar}
            onDelete={
              isMe && onDeleteMessage
                ? () => onDeleteMessage(msg.id)
                : undefined
            }
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
