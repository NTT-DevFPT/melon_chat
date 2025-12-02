import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';

interface MessageListSkeletonProps {
  count?: number;
}

export const MessageListSkeleton: React.FC<MessageListSkeletonProps> = ({
  count = 8,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {Array.from({ length: count }).map((_, index) => {
        // Alternate between left and right aligned messages
        const isRight = index % 3 === 0;

        return (
          <div
            key={index}
            className={`flex ${isRight ? 'justify-end' : 'justify-start'} items-end space-x-2`}
          >
            {/* Avatar for left-aligned messages */}
            {!isRight && (
              <SkeletonLoader variant="circular" width="32px" height="32px" />
            )}

            {/* Message bubble skeleton */}
            <div
              className={`flex flex-col space-y-1 ${isRight ? 'items-end' : 'items-start'}`}
            >
              {/* Sender name skeleton (only for left-aligned) */}
              {!isRight && (
                <SkeletonLoader width="80px" height="12px" variant="text" />
              )}

              {/* Message content skeleton - varying widths */}
              <SkeletonLoader
                width={index % 2 === 0 ? '240px' : '180px'}
                height={index % 4 === 0 ? '60px' : '40px'}
                className="rounded-2xl"
              />

              {/* Timestamp skeleton */}
              <SkeletonLoader width="60px" height="10px" variant="text" />
            </div>

            {/* Avatar for right-aligned messages */}
            {isRight && (
              <SkeletonLoader variant="circular" width="32px" height="32px" />
            )}
          </div>
        );
      })}
    </div>
  );
};
