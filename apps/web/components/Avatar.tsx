import React from 'react';
import { UserStatus } from '../types';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', status, className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const statusColors = {
    [UserStatus.ONLINE]: 'bg-green-500',
    [UserStatus.OFFLINE]: 'bg-slate-500',
    [UserStatus.AWAY]: 'bg-yellow-500',
    [UserStatus.BUSY]: 'bg-red-500',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-slate-800 shadow-sm`}
      />
      {status && (
        <span
          className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-slate-900 ${statusColors[status]}`}
        />
      )}
    </div>
  );
};