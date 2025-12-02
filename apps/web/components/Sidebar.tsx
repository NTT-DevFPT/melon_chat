import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Settings,
  Search,
  Plus,
  UserPlus,
  Check,
  X,
} from 'lucide-react';
import { Conversation, User, UserStatus, PendingFriendRequest } from '../types';
import { Avatar } from './Avatar';
import { ConversationList } from './ConversationList';
import { client } from '@/src/api/client';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  conversations: Conversation[];
  users: Record<string, User>;
  friends: User[];
  pendingRequests: PendingFriendRequest[];
  currentUserId: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateGroup: (name: string, participantIds: string[]) => void;
  onOpenSettings: () => void;
  onOpenFriendChat: (userId: string) => void;
  onAcceptFriendRequest: (friendshipId: string) => void;
  onRejectFriendRequest: (friendshipId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  users,
  friends,
  pendingRequests,
  currentUserId,
  activeConversationId,
  onSelectConversation,
  onCreateGroup,
  onOpenSettings,
  onOpenFriendChat,
  onAcceptFriendRequest,
  onRejectFriendRequest,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'requests'>(
    'chats'
  );

  // Group Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );

  // Friend Modal State
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentFriendRequests, setSentFriendRequests] = useState<Set<string>>(
    new Set()
  );

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users when query changes
  useEffect(() => {
    if (!friendSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await client.get<User[]>(
          `/users/search?q=${encodeURIComponent(friendSearchQuery)}`
        );
        // Filter out current user from results
        setSearchResults(response.data.filter((u) => u.id !== currentUserId));
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [friendSearchQuery, currentUserId]);

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedParticipants.length === 0) return;
    onCreateGroup(groupName, selectedParticipants);
    setIsGroupModalOpen(false);
    setGroupName('');
    setSelectedParticipants([]);
  };

  const handleAddFriendClick = () => {
    setIsMenuOpen(false);
    setIsFriendModalOpen(true);
    setFriendSearchQuery('');
    setSearchResults([]);
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await client.post(`/friendships/request/${userId}`);
      const newSet = new Set(sentFriendRequests);
      newSet.add(userId);
      setSentFriendRequests(newSet);
      toast.success('Friend request sent!');
    } catch (error) {
      console.error('Failed to send friend request', error);
      toast.error('Failed to send friend request');
    }
  };

  return (
    <div className="w-96 h-full bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center justify-between relative">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Melon Chat Logo"
            className="w-10 h-10 melon-logo"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <h1 className="text-xl font-bold text-white tracking-tight">
            Melon <span style={{ color: '#FF6B9D' }}>Chat</span> 🍉
          </h1>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-all ${isMenuOpen ? 'bg-slate-700 text-white rotate-45' : ''}`}
          >
            <Plus size={20} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsGroupModalOpen(true);
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 flex items-center gap-3 transition-colors"
              >
                <Users size={16} style={{ color: '#FF6B9D' }} />
                <span className="text-sm font-medium">Create Group</span>
              </button>
              <div className="h-px bg-slate-700 mx-2"></div>
              <button
                onClick={handleAddFriendClick}
                className="w-full text-left px-4 py-3 hover:bg-slate-700 text-slate-200 flex items-center gap-3 transition-colors"
              >
                <UserPlus size={16} className="text-emerald-400" />
                <span className="text-sm font-medium">Add Friend</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full bg-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none placeholder-slate-500"
            style={{ '--focus-ring-color': '#FF6B9D' } as React.CSSProperties}
            onFocus={(e) =>
              (e.currentTarget.style.boxShadow =
                '0 0 0 2px rgba(255, 107, 157, 0.5)')
            }
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
          />
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex px-4 space-x-1 mb-2">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chats' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          style={{
            borderColor: activeTab === 'chats' ? '#FF6B9D' : 'transparent',
          }}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'friends' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          style={{
            borderColor: activeTab === 'friends' ? '#FF6B9D' : 'transparent',
          }}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'requests' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          style={{
            borderColor: activeTab === 'requests' ? '#FF6B9D' : 'transparent',
          }}
        >
          Requests
          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 px-2 py-[1px] text-[10px] rounded-full bg-emerald-500 text-white">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Dynamic List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'chats' && (
          <ConversationList
            conversations={conversations}
            users={users}
            currentUserId={currentUserId}
            activeConversationId={activeConversationId}
            onSelectConversation={onSelectConversation}
          />
        )}

        {activeTab === 'friends' &&
          (friends.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No friends yet. Use &quot;Add Friend&quot; to get started.
            </div>
          ) : (
            friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => onOpenFriendChat(friend.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 border-l-4 border-transparent hover:bg-slate-800/40 transition-colors rounded-xl"
              >
                <Avatar
                  src={friend.avatarUrl}
                  alt={friend.fullName}
                  size="md"
                  status={friend.status}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-100 truncate">
                      {friend.fullName}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${friend.status === UserStatus.ONLINE ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}
                    >
                      {friend.status === UserStatus.ONLINE
                        ? 'Online'
                        : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">@{friend.username}</p>
                </div>
              </button>
            ))
          ))}

        {activeTab === 'requests' &&
          (pendingRequests.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No pending requests right now.
            </div>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="px-4 py-3 flex items-center gap-3 border border-slate-800 bg-slate-900/40 rounded-xl mx-4 mb-3"
              >
                <Avatar
                  src={request.requesterAvatarUrl || undefined}
                  alt={request.requesterName || 'Friend request'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-100 truncate">
                    {request.requesterName || 'Unknown user'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    @{request.requesterUsername || 'unknown'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Sent {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAcceptFriendRequest(request.id)}
                    className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                    title="Accept"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => onRejectFriendRequest(request.id)}
                    className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          ))}
      </div>

      {/* User Profile Mini */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <Avatar
            src={users[currentUserId]?.avatarUrl}
            alt="My Profile"
            size="sm"
            status={UserStatus.ONLINE}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {users[currentUserId]?.fullName || 'Me'}
            </span>
            <span className="text-xs text-green-400">Online</span>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Create Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Create New Group
                </h3>
                <p className="text-xs text-slate-400">
                  Name your group and add members
                </p>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Group Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={18} className="text-slate-500" />
                  </div>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700 outline-none transition-all"
                    style={
                      {
                        '--focus-border-color': '#FF6B9D',
                      } as React.CSSProperties
                    }
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#FF6B9D';
                      e.currentTarget.style.boxShadow = '0 0 0 1px #FF6B9D';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#475569';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    placeholder="e.g. Project Alpha Team"
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Select Members
                </label>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.values(users)
                    .filter((u) => u.id !== currentUserId)
                    .map((user) => {
                      const isSelected = selectedParticipants.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleParticipant(user.id)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'border-transparent' : 'hover:bg-slate-800 border-transparent'}`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: 'rgba(255, 107, 157, 0.1)',
                                  borderColor: 'rgba(255, 107, 157, 0.3)',
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user.avatarUrl}
                              size="sm"
                              alt={user.username}
                              status={user.status}
                            />
                            <div className="flex flex-col">
                              <span
                                className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}
                              >
                                {user.fullName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {user.username}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: '#FF6B9D',
                                    borderColor: '#FF6B9D',
                                    transform: 'scale(1.1)',
                                  }
                                : { borderColor: '#475569' }
                            }
                          >
                            {isSelected && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl">
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={
                  !groupName.trim() || selectedParticipants.length === 0
                }
                className="px-5 py-2.5 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all melon-glow"
                style={{ backgroundColor: '#FF6B9D' }}
                onMouseEnter={(e) =>
                  !e.currentTarget.disabled &&
                  (e.currentTarget.style.backgroundColor = '#E63E6D')
                }
                onMouseLeave={(e) =>
                  !e.currentTarget.disabled &&
                  (e.currentTarget.style.backgroundColor = '#FF6B9D')
                }
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {isFriendModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-white">Add New Friend</h3>
                <p className="text-xs text-slate-400">
                  Search and connect with people
                </p>
              </div>
              <button
                onClick={() => setIsFriendModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Find People
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-500" />
                  </div>
                  <input
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Search by username or name..."
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {friendSearchQuery
                    ? 'Search Results'
                    : 'Start typing to search'}
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {isSearching ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Searching...
                    </div>
                  ) : searchResults.length === 0 && friendSearchQuery ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No users found matching &quot;{friendSearchQuery}&quot;
                    </div>
                  ) : (
                    searchResults.map((user) => {
                      const isSent = sentFriendRequests.has(user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all border border-slate-800 hover:border-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user.avatarUrl}
                              size="sm"
                              alt={user.username}
                              status={user.status}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-200">
                                {user.fullName}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                @{user.username}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendFriendRequest(user.id)}
                            disabled={isSent}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isSent
                                ? 'bg-slate-700 text-slate-400 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                            }`}
                          >
                            {isSent ? 'Request Sent' : 'Add Friend'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-800 flex justify-end bg-slate-900 rounded-b-2xl">
              <button
                onClick={() => setIsFriendModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
