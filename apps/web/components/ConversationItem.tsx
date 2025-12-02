import React from 'react';
import { Avatar } from './Avatar';
import { UserStatus } from '../types';

interface ConversationItemProps {
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isActive: boolean;
  status?: UserStatus;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  name,
  avatar,
  lastMessage,
  timestamp,
  unreadCount,
  isActive,
  status,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 cursor-pointer transition-colors flex items-center space-x-3 ${
        isActive
          ? 'bg-slate-800/50 border-l-4'
          : 'hover:bg-slate-800/30 border-l-4 border-transparent'
      }`}
      style={isActive ? { borderLeftColor: '#FF6B9D' } : undefined}
    >
      <Avatar src={avatar} alt="avatar" size="md" status={status} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-sm font-semibold text-slate-100 truncate">
            {name}
          </h3>
          <span className="text-xs text-slate-500">{timestamp}</span>
        </div>
        <div className="flex justify-between items-center">
          <p
            className={`text-xs truncate max-w-[140px] ${
              unreadCount && unreadCount > 0
                ? 'text-slate-100 font-semibold'
                : 'text-slate-400'
            }`}
          >
            {lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
};
