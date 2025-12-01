import React from 'react';
import { Message, MessageType, User } from '../types';
import { Check, CheckCheck, FileText, Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  sender?: User;
  showAvatar: boolean;
  onDelete?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  sender,
  showAvatar,
  onDelete,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex w-full mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      {!isMe && (
        <div className="w-8 mr-2 flex-shrink-0 flex items-end">
          {showAvatar && sender ? (
            <img
              src={sender.avatarUrl}
              alt={sender.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      <div
        className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
      >
        {/* Sender Name (Group Chat context) */}
        {!isMe && showAvatar && sender && (
          <span className="text-xs text-slate-400 ml-1 mb-1">
            {sender.fullName}
          </span>
        )}

        <div
          className={`px-4 py-2 rounded-2xl shadow-sm relative group`}
          style={{
            backgroundColor: isMe ? '#FF6B9D' : '#1e293b',
            color: 'white',
            borderBottomRightRadius: isMe ? '0' : undefined,
            borderBottomLeftRadius: !isMe ? '0' : undefined,
          }}
        >
          {/* Delete button (only for my messages) */}
          {isMe && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="absolute -top-2 -right-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
          {/* Image Attachments */}
          {message.type === MessageType.IMAGE &&
            (message.attachmentUrl || message.attachments?.[0]?.url) && (
              <div className="mb-2">
                <img
                  src={message.attachmentUrl || message.attachments?.[0]?.url}
                  alt="attachment"
                  className="rounded-lg max-w-full h-auto"
                />
              </div>
            )}

          {/* Video Attachments */}
          {message.type === MessageType.VIDEO &&
            (message.attachmentUrl || message.attachments?.[0]?.url) && (
              <div className="mb-2">
                <video
                  controls
                  src={message.attachmentUrl || message.attachments?.[0]?.url}
                  className="rounded-lg max-w-full h-auto"
                />
              </div>
            )}

          {/* File Attachments */}
          {message.type === MessageType.FILE &&
            (message.attachmentUrl || message.attachments?.[0]?.url) && (
              <div className="mb-2">
                <a
                  href={message.attachmentUrl || message.attachments?.[0]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 rounded-lg hover:bg-black/10 transition-colors"
                  style={{ backgroundColor: isMe ? '#E63E6D' : '#0f172a' }}
                >
                  <FileText size={20} className="mr-2 opacity-80" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm truncate font-medium">
                      {message.attachmentName ||
                        message.attachments?.[0]?.name ||
                        'File'}
                    </span>
                    <span className="text-xs opacity-70">
                      {(
                        (message.attachmentSize ||
                          message.attachments?.[0]?.size ||
                          0) / 1024
                      ).toFixed(1)}{' '}
                      KB
                    </span>
                  </div>
                </a>
              </div>
            )}

          {/* Text Content */}
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          {/* Timestamp & Status */}
          <div
            className="text-[10px] mt-1 flex items-center"
            style={{
              justifyContent: isMe ? 'flex-end' : 'flex-start',
              color: isMe ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8',
            }}
          >
            <span>{formatTime(message.createdAt)}</span>
            {isMe && (
              <span className="ml-1">
                {message.status === 'SENT' && <Check size={12} />}
                {message.status === 'DELIVERED' && <CheckCheck size={12} />}
                {message.status === 'READ' && (
                  <CheckCheck size={12} style={{ color: '#4ADE80' }} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
