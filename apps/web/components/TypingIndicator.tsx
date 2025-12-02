import React from 'react';

interface TypingIndicatorProps {
  usernames: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  usernames,
}) => {
  if (usernames.length === 0) return null;

  const displayText =
    usernames.length === 1
      ? `${usernames[0]} is typing...`
      : usernames.length === 2
        ? `${usernames[0]} and ${usernames[1]} are typing...`
        : `${usernames[0]} and ${usernames.length - 1} others are typing...`;

  return (
    <div className="px-6 py-2 text-sm text-slate-400 flex items-center gap-2">
      <span>{displayText}</span>
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
};
