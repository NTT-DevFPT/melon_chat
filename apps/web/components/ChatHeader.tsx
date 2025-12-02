import React from 'react';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { ConversationType } from '../types';

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  avatar: string;
  conversationType?: ConversationType;
  onPhoneCall: () => void;
  onVideoCall: () => void;
  onToggleInfo: () => void;
  isInfoOpen: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  avatar,
  conversationType,
  onPhoneCall,
  onVideoCall,
  onToggleInfo,
  isInfoOpen,
}) => {
  return (
    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 z-10">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={avatar}
            alt={title}
            className="w-10 h-10 rounded-full object-cover"
          />
          {conversationType === ConversationType.DIRECT && (
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-slate-900 bg-green-500" />
          )}
        </div>
        <div>
          <h2 className="text-slate-100 font-semibold">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4" style={{ color: '#FF6B9D' }}>
        <button
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          onClick={onPhoneCall}
          title="Phone Call"
        >
          <Phone size={20} />
        </button>
        <button
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          onClick={onVideoCall}
          title="Video Call"
        >
          <Video size={20} />
        </button>
        <button
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          onClick={onToggleInfo}
          title={isInfoOpen ? 'Hide Info' : 'Show Info'}
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
};
