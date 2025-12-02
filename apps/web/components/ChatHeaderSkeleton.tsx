import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';

export const ChatHeaderSkeleton: React.FC = () => {
  return (
    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
      {/* Left side - Avatar and user info */}
      <div className="flex items-center space-x-4">
        {/* Avatar skeleton */}
        <SkeletonLoader variant="circular" width="40px" height="40px" />

        {/* User info skeleton */}
        <div className="space-y-2">
          {/* Name skeleton */}
          <SkeletonLoader width="120px" height="16px" variant="text" />
          {/* Status skeleton */}
          <SkeletonLoader width="60px" height="12px" variant="text" />
        </div>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center space-x-2">
        {/* Button skeletons */}
        <SkeletonLoader variant="circular" width="36px" height="36px" />
        <SkeletonLoader variant="circular" width="36px" height="36px" />
        <SkeletonLoader variant="circular" width="36px" height="36px" />
      </div>
    </div>
  );
};
