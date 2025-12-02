import React from 'react';
import { MessageReaction } from '../types';

interface ReactionDisplayProps {
  reactions: MessageReaction[];
  reactionCounts: Record<string, number>;
  currentUserId: string;
  onReactionClick: (emoji: string) => void;
}

export const ReactionDisplay: React.FC<ReactionDisplayProps> = ({
  reactions,
  reactionCounts,
  currentUserId,
  onReactionClick,
}) => {
  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    },
    {} as Record<string, MessageReaction[]>
  );

  // Check if current user has reacted with this emoji
  const hasUserReacted = (emoji: string) => {
    return reactions.some(
      (r) => r.emoji === emoji && r.userId === currentUserId
    );
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => {
        const count = reactionCounts[emoji] || emojiReactions.length;
        const userReacted = hasUserReacted(emoji);

        return (
          <button
            key={emoji}
            onClick={() => onReactionClick(emoji)}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm
              transition-all duration-150 hover:scale-105
              ${
                userReacted
                  ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
              }
            `}
            aria-label={`${emoji} reaction, ${count} ${count === 1 ? 'person' : 'people'}`}
          >
            <span className="text-base">{emoji}</span>
            <span
              className={`text-xs font-medium ${userReacted ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
