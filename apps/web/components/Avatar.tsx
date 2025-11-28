import React from 'react';
import { UserStatus } from '../types';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = 'User', size = 'md', status, className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const statusColors = {
    [UserStatus.ONLINE]: 'bg-green-500',
    [UserStatus.AWAY]: 'bg-yellow-500',
    [UserStatus.BUSY]: 'bg-red-500',
    [UserStatus.OFFLINE]: 'bg-gray-500',
  };

  // Use default avatar if src is empty or null
  const avatarSrc = src && src.trim() !== ''
    ? src
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=f0f0f0&color=999999&size=200`;

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={avatarSrc}
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