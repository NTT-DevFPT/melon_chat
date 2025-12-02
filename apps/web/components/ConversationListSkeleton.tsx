import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';

interface ConversationListSkeletonProps {
  count?: number;
}

export const ConversationListSkeleton: React.FC<
  ConversationListSkeletonProps
> = ({ count = 5 }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="px-4 py-3 flex items-center space-x-3 border-l-4 border-transparent"
        >
          {/* Avatar skeleton */}
          <SkeletonLoader variant="circular" width="48px" height="48px" />

          {/* Content skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex justify-between items-baseline">
              {/* Name skeleton */}
              <SkeletonLoader width="60%" height="14px" variant="text" />
              {/* Time skeleton */}
              <SkeletonLoader width="40px" height="12px" variant="text" />
            </div>
            {/* Message preview skeleton */}
            <SkeletonLoader width="80%" height="12px" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
};
