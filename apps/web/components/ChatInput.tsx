import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Paperclip, Smile, Send, Image as ImageIcon } from 'lucide-react';
import { webSocketService } from '@/src/services/WebSocketService';

const EMOJIS = [
  '🍉',
  '😀',
  '😂',
  '🤣',
  '❤️',
  '😍',
  '😒',
  '👌',
  '😭',
  '😩',
  '🫣',
  '🫡',
  '🫠',
  '💀',
  '🤡',
  '🤖',
  '👻',
  '👽',
  '💩',
  '👍',
  '👎',
  '🔥',
  '🎉',
  '👋',
  '🙏',
];

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
  conversationId?: string | null;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onFileSelect,
  isUploading = false,
  conversationId = null,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const handleAddEmoji = (emoji: string) => {
    onChange(value + emoji);
  };

  // Debounced typing indicator
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (conversationId && webSocketService.isConnected()) {
        webSocketService.sendTypingIndicator(conversationId, isTyping);
        isTypingRef.current = isTyping;
      }
    },
    [conversationId]
  );

  // Handle input change with typing indicator
  const handleInputChange = useCallback(
    (newValue: string) => {
      onChange(newValue);

      if (!conversationId) return;

      // Send typing indicator if not already sent
      if (!isTypingRef.current && newValue.trim()) {
        sendTypingIndicator(true);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator after 3 seconds
      if (newValue.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingIndicator(false);
        }, 3000);
      } else {
        // If input is empty, stop typing immediately
        sendTypingIndicator(false);
      }
    },
    [conversationId, onChange, sendTypingIndicator]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Stop typing indicator when sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingIndicator(false);
      onSend();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && conversationId) {
        sendTypingIndicator(false);
      }
    };
  }, [conversationId, sendTypingIndicator]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 relative m-0">
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 right-20 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 w-72 animate-in slide-in-from-bottom-5 duration-200 z-50"
        >
          <div className="grid grid-cols-6 gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddEmoji(emoji)}
                className="text-2xl hover:bg-slate-700 rounded-lg p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl flex items-center px-4 py-2 shadow-inner">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={onFileSelect}
        />

        <button
          className={`p-2 transition-colors melon-button juice-splash ${isUploading ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400'}`}
          style={{ '--hover-color': '#FF6B9D' } as React.CSSProperties}
          onMouseEnter={(e) =>
            !isUploading && (e.currentTarget.style.color = '#FF6B9D')
          }
          onMouseLeave={(e) =>
            !isUploading && (e.currentTarget.style.color = '#94a3b8')
          }
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          title="Attach File"
        >
          <Paperclip size={20} />
        </button>
        <button
          className="text-slate-400 p-2 transition-colors melon-button juice-splash"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6B9D')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          onClick={() => fileInputRef.current?.click()}
          title="Send Image"
        >
          <ImageIcon size={20} />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 bg-transparent text-slate-200 px-4 py-2 focus:outline-none placeholder-slate-500"
        />
        <button
          className="text-slate-400 p-2 transition-colors melon-button"
          style={{ color: showEmojiPicker ? '#FF6B9D' : undefined }}
          onMouseEnter={(e) =>
            !showEmojiPicker && (e.currentTarget.style.color = '#FF6B9D')
          }
          onMouseLeave={(e) =>
            !showEmojiPicker && (e.currentTarget.style.color = '#94a3b8')
          }
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <Smile size={20} />
        </button>
        <button
          onClick={onSend}
          className={`p-2 rounded-xl ml-2 transition-all melon-button juice-splash ${value.trim() ? 'text-white melon-glow' : 'bg-slate-700 text-slate-500'}`}
          style={{
            backgroundColor: value.trim() ? '#FF6B9D' : undefined,
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
