import React from 'react';

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😢', '😠'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelectEmoji,
  onClose,
}) => {
  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <div
      className="absolute bottom-full mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-2 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {AVAILABLE_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          className="text-2xl hover:scale-125 transition-transform duration-150 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
