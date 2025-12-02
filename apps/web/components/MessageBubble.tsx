import React, { useState } from 'react';
import { Message, MessageType, User } from '../types';
import {
  Check,
  CheckCheck,
  FileText,
  Trash2,
  Smile,
  Edit2,
} from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';
import { ReactionDisplay } from './ReactionDisplay';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  sender?: User;
  showAvatar: boolean;
  currentUserId: string;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
  onAddReaction?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  sender,
  showAvatar,
  currentUserId,
  onDelete,
  onEdit,
  onAddReaction,
  onRemoveReaction,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const canEdit = () => {
    if (!isMe || message.type !== MessageType.TEXT) return false;

    // Check if message is within 15 minutes of creation
    const createdAt = new Date(message.createdAt);
    const now = new Date();
    const fifteenMinutes = 15 * 60 * 1000;
    return now.getTime() - createdAt.getTime() < fifteenMinutes;
  };

  const handleReactionClick = (emoji: string) => {
    // Check if user already reacted with this emoji
    const userReaction = message.reactions?.find(
      (r) => r.emoji === emoji && r.userId === currentUserId
    );

    if (userReaction) {
      onRemoveReaction?.(emoji);
    } else {
      onAddReaction?.(emoji);
    }
  };

  const handleAddReaction = (emoji: string) => {
    onAddReaction?.(emoji);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditContent(message.content || '');
  };

  const handleEditSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(message.content || '');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
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
          {/* Action buttons - hide for deleted messages */}
          {!message.deletedAt && (
            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Reaction button */}
              <button
                type="button"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full p-1 shadow-sm"
                title="Add reaction"
              >
                <Smile size={14} />
              </button>

              {/* Edit button (only for my text messages within 15 minutes) */}
              {canEdit() && onEdit && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full p-1 shadow-sm"
                  title="Edit message"
                >
                  <Edit2 size={14} />
                </button>
              )}

              {/* Delete button (only for my messages) */}
              {isMe && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full p-1 shadow-sm"
                  title="Delete message"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}

          {/* Reaction Picker */}
          {showReactionPicker && (
            <ReactionPicker
              onSelectEmoji={handleAddReaction}
              onClose={() => setShowReactionPicker(false)}
            />
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
          {message.content && !isEditing && (
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap ${message.deletedAt ? 'italic opacity-60' : ''}`}
            >
              {message.content}
            </p>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <div className="w-full">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full min-h-[60px] p-2 text-sm bg-white/10 border border-white/20 rounded text-white resize-none focus:outline-none focus:border-white/40"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleEditSave}
                  className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Timestamp & Status */}
          <div
            className="text-[10px] mt-1 flex items-center gap-1"
            style={{
              justifyContent: isMe ? 'flex-end' : 'flex-start',
              color: isMe ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8',
            }}
          >
            <span>{formatTime(message.createdAt)}</span>
            {message.isEdited && (
              <span className="italic opacity-70">(edited)</span>
            )}
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

        {/* Reaction Display */}
        {message.reactions && message.reactions.length > 0 && (
          <ReactionDisplay
            reactions={message.reactions}
            reactionCounts={message.reactionCounts || {}}
            currentUserId={currentUserId}
            onReactionClick={handleReactionClick}
          />
        )}
      </div>
    </div>
  );
};
