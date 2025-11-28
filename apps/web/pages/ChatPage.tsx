import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MessageBubble } from '../components/MessageBubble';
import { VideoCall } from '../components/VideoCall';
import { SettingsModal } from '../components/SettingsModal';
import { Phone, Video, MoreVertical, Paperclip, Smile, Send, Image as ImageIcon } from 'lucide-react';
import { Conversation, User, Message, UserStatus, ConversationType, MessageType, PendingFriendRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { client } from '@/src/api/client';
import { toast } from 'react-hot-toast';
import { webSocketService } from '@/src/services/WebSocketService';

const EMOJIS = ["🍉", "😀", "😂", "🤣", "❤️", "😍", "😒", "👌", "😭", "😩", "🫣", "🫡", "🫠", "💀", "🤡", "🤖", "👻", "👽", "💩", "👍", "👎", "🔥", "🎉", "👋", "🙏"];

export const ChatPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [friends, setFriends] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const activeConvIdRef = useRef<string | null>(null);

    const { user: currentUser, logout } = useAuth();

    // Update ref when activeConvId changes
    useEffect(() => {
        activeConvIdRef.current = activeConvId;
    }, [activeConvId]);

    // WebSocket Integration
    useEffect(() => {
        if (!currentUser) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        webSocketService.connect(token, () => {
            webSocketService.subscribe('/user/queue/messages', async (message: Message) => {
                const isActive = activeConvIdRef.current === message.conversationId;
                
                // Handle new message
                if (isActive) {
                    setMessages(prev => [...prev, message]);
                    // Mark as read immediately if in active room (user is viewing, so automatically read)
                    try {
                        await client.post(`/chats/${message.conversationId}/read`);
                        // Refresh conversations to sync with backend after marking as read
                        setTimeout(() => loadConversations(), 300);
                    } catch (err) {
                        console.error("Failed to mark as read", err);
                    }
                }

                // Update conversations list
                setConversations(prev => {
                    const index = prev.findIndex(c => c.id === message.conversationId);
                    if (index !== -1) {
                        const current = prev[index];
                        // If active room, unreadCount is always 0 (user is viewing)
                        // If not active, increment unreadCount only if message is from others
                        const isMyMessage = message.senderId === currentUser?.id;
                        const unreadBase = current.unreadCount ?? 0;
                        const updatedConv: Conversation = {
                            ...current,
                            updatedAt: message.createdAt,
                            lastMessageId: message.id,
                            lastMessageContent: message.content,
                            lastMessageSenderId: message.senderId,
                            lastMessageAt: message.createdAt,
                            unreadCount: isActive ? 0 : (isMyMessage ? 0 : unreadBase + 1)
                        };
                        const newConvs = [...prev];
                        newConvs.splice(index, 1);
                        newConvs.unshift(updatedConv);
                        return newConvs;
                    }
                    // If new conversation, we might want to fetch it. For now, just ignore or trigger a refetch.
                    return prev;
                });
            });
        });

        return () => {
            webSocketService.disconnect();
        };
    }, [currentUser]);

    const loadConversations = useCallback(async () => {
        try {
            const response = await client.get<Conversation[]>('/chats');
            // Trust backend unreadCount - only override for active room if we're currently viewing it
            const updated = response.data.map(conv => {
                // If this is the active room and we're viewing it, ensure unreadCount = 0
                // Otherwise, trust backend value
                if (conv.id === activeConvId && activeConvId) {
                    return { ...conv, unreadCount: 0 };
                }
                return conv;
            });
            setConversations(updated);
            setActiveConvId(prev => prev ?? (updated[0]?.id ?? null));
            return updated;
        } catch (error) {
            console.error("Failed to fetch conversations", error);
            return [];
        }
    }, [activeConvId]);

    // Fetch conversations (Initial + Auto-refresh)
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Auto-refresh conversations periodically
    useEffect(() => {
        const interval = setInterval(() => {
            loadConversations();
        }, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [loadConversations]);

    // Refresh conversations when tab becomes visible
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadConversations();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [loadConversations]);

    const normalizeMessages = (payload: { content?: Message[] } | Message[]) => {
        if (Array.isArray(payload)) return payload;
        return payload?.content ?? [];
    };

    const MESSAGE_POLL_INTERVAL_MS = 1200;

    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            const response = await client.get<{ content?: Message[] } | Message[]>(`/chats/${conversationId}/messages`);
            setMessages([...normalizeMessages(response.data)].reverse());
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    }, []);

    const fetchRecentMessages = useCallback(async (conversationId: string) => {
        try {
            const last = messages[messages.length - 1];
            if (!last) {
                await fetchMessages(conversationId);
                return;
            }
            const response = await client.get<Message[]>(`/chats/${conversationId}/messages/recent`, {
                params: { since: last.createdAt }
            });
            if (response.data.length) {
                setMessages(prev => [...prev, ...response.data]);
                // If this is the active room, mark as read (user is viewing, so automatically read)
                if (activeConvIdRef.current === conversationId) {
                    try {
                        await client.post(`/chats/${conversationId}/read`);
                        // Refresh conversations to sync with backend
                        setTimeout(() => loadConversations(), 300);
                    } catch (err) {
                        console.error("Failed to mark as read", err);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch recent messages", error);
        }
    }, [messages, fetchMessages, loadConversations]);

    // Fetch messages for active conversation and mark as read
    useEffect(() => {
        if (!activeConvId) return;
        fetchMessages(activeConvId);
        
        // Mark conversation as read when entering the room (call backend)
        const markAsRead = async () => {
            try {
                await client.post(`/chats/${activeConvId}/read`);
                // Refresh conversations to sync with backend after marking as read
                // This ensures lastReadAt is updated and unreadCount is correct
                setTimeout(() => loadConversations(), 300);
            } catch (error) {
                console.error("Failed to mark as read", error);
            }
        };
        markAsRead();
        
        // Update UI immediately (optimistic update)
        setConversations(prev => prev.map(conv => 
            conv.id === activeConvId 
                ? { ...conv, unreadCount: 0 }
                : conv
        ));
    }, [activeConvId, fetchMessages, loadConversations]);

    // Poll only recent messages to keep near-realtime with minimal payload
    useEffect(() => {
        if (!activeConvId) return;
        const interval = setInterval(() => fetchRecentMessages(activeConvId), MESSAGE_POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [activeConvId, fetchRecentMessages]);

    const loadFriends = useCallback(async () => {
        if (!currentUser) return;
        try {
            const response = await client.get<User[]>('/friendships');
            const newUsers: Record<string, User> = {};
            response.data.forEach(u => newUsers[u.id] = u);
            newUsers[currentUser.id] = currentUser;
            setUsers(newUsers);
            setFriends(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    }, [currentUser]);

    const loadPendingRequests = useCallback(async () => {
        if (!currentUser) return;
        try {
            const response = await client.get<PendingFriendRequest[]>('/friendships/requests');
            setPendingRequests(response.data);
        } catch (error) {
            console.error("Failed to fetch pending requests", error);
        }
    }, [currentUser]);

    useEffect(() => {
        loadFriends();
    }, [loadFriends]);

    useEffect(() => {
        loadPendingRequests();
    }, [loadPendingRequests]);

    // Presence polling for friends
    useEffect(() => {
        const interval = setInterval(() => {
            loadFriends();
        }, 15000);
        return () => clearInterval(interval);
    }, [loadFriends]);

    // Auto-refresh pending requests periodically
    useEffect(() => {
        const interval = setInterval(() => {
            loadPendingRequests();
        }, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, [loadPendingRequests]);

    // Refresh all data when tab becomes visible
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadFriends();
                loadPendingRequests();
                loadConversations();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [loadFriends, loadPendingRequests, loadConversations]);

    // Scroll to bottom on new message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeConvId]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !activeConvId) return;

        try {
            const response = await client.post<Message>(`/chats/${activeConvId}/messages`, {
                content: inputValue,
                type: MessageType.TEXT
            });
            setInputValue('');
            setShowEmojiPicker(false);
            // Refresh messages immediately (or wait for WebSocket)
            // Waiting for WebSocket is better for consistency, but immediate feedback is nice.
            // Let's rely on WebSocket for the incoming message, but we can optimistically add it if we want.
            // For now, let's just fetch messages to be sure, or rely on WS.
            // Actually, if we rely on WS, we don't need to fetch.
            // But let's fetch just in case WS is slow or disconnected.
            if (response.data) {
                setMessages(prev => [...prev, response.data]);
                // Update conversation immediately
                setConversations(prev => prev.map(conv =>
                    conv.id === activeConvId
                        ? {
                            ...conv,
                            updatedAt: response.data.createdAt,
                            lastMessageId: response.data.id,
                            lastMessageContent: response.data.content,
                            lastMessageSenderId: response.data.senderId,
                            lastMessageAt: response.data.createdAt,
                            unreadCount: 0 // Mark as read since we're in the room
                        }
                        : conv
                ));
                // Refresh conversations to sync with backend
                setTimeout(() => loadConversations(), 500);
            } else {
                await fetchMessages(activeConvId);
            }
        } catch (error) {
            console.error("Failed to send message", error);
            toast.error("Failed to send message");
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // File upload logic would go here. 
        // For now, just clear the input as we haven't implemented file upload API yet.
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast.error("File upload not implemented yet");
    };

    const handleAddEmoji = (emoji: string) => {
        setInputValue(prev => prev + emoji);
    };

    const handleCreateGroup = async (name: string, participantIds: string[]) => {
        try {
            await client.post('/chats/group', {
                name,
                participantIds
            });
            toast.success("Group created!");
            await loadConversations();
        } catch (error) {
            console.error("Failed to create group", error);
            toast.error("Failed to create group");
        }
    };

    const findDirectConversation = (list: Conversation[], friendId: string) =>
        list.find(conv =>
            conv.type === ConversationType.DIRECT &&
            Array.isArray(conv.participants) &&
            conv.participants.includes(friendId)
        );

    const handleOpenFriendConversation = async (friendId: string) => {
        const existing = findDirectConversation(conversations, friendId);
        if (existing) {
            setActiveConvId(existing.id);
            return;
        }
        try {
            const response = await client.post<Conversation>(`/chats/direct/${friendId}`);
            await loadConversations();
            if (response.data?.id) {
                setActiveConvId(response.data.id);
                toast.success("New chat room created");
            } else {
                const updated = await loadConversations();
                const created = findDirectConversation(updated, friendId);
                if (created) {
                    setActiveConvId(created.id);
                    toast.success("New chat room created");
                } else {
                    toast.error("Chat created but not found, try refreshing.");
                }
            }
        } catch (error) {
            console.error("Failed to open chat", error);
            toast.error("Cannot start chat with user");
        }
    };

    const handleAcceptFriendRequest = async (friendshipId: string) => {
        try {
            await client.put(`/friendships/${friendshipId}/accept`);
            toast.success("Friend request accepted");
            // Auto-refresh all data
            await Promise.all([loadFriends(), loadPendingRequests(), loadConversations()]);
        } catch (error) {
            console.error("Failed to accept friend request", error);
            toast.error("Failed to accept request");
        }
    };

    const handleRejectFriendRequest = async (friendshipId: string) => {
        try {
            await client.put(`/friendships/${friendshipId}/reject`);
            toast.success("Friend request rejected");
            // Auto-refresh pending requests
            await loadPendingRequests();
        } catch (error) {
            console.error("Failed to reject friend request", error);
            toast.error("Failed to reject request");
        }
    };

    const activeConv = conversations.find(c => c.id === activeConvId);

    // Helper to get chat header info
    const getHeaderInfo = () => {
        if (!activeConv) return { title: 'Select Chat', subtitle: '', avatar: '' };

        if (activeConv.type === ConversationType.GROUP) {
            const participantCount = Array.isArray(activeConv.participants) ? activeConv.participants.length : 0;
            return {
                title: activeConv.name || 'Group Chat',
                subtitle: `${participantCount} participants`,
                avatar: activeConv.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConv.name || 'G')}&background=FF6B9D&color=fff`
            };
        } else {
            const participants = Array.isArray(activeConv.participants) ? activeConv.participants : [];
            const otherId = participants.find(id => id !== currentUser?.id);
            // Try to find user in our map, otherwise fallback to unknown
            const user = users[otherId || ''];
            return {
                title: user?.fullName || 'Unknown',
                subtitle: user?.status === UserStatus.ONLINE ? 'Online' : 'Offline',
                avatar: user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=random`
            };
        }
    };

    const headerInfo = getHeaderInfo();

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            {/* Watermelon Seed Particles Background */}
            <div className="watermelon-seeds">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="seed" />
                ))}
            </div>

            <Sidebar
                conversations={conversations}
                users={users}
                friends={friends}
                pendingRequests={pendingRequests}
                currentUserId={currentUser?.id || ''}
                activeConversationId={activeConvId}
                onSelectConversation={setActiveConvId}
                onCreateGroup={handleCreateGroup}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenFriendChat={handleOpenFriendConversation}
                onAcceptFriendRequest={handleAcceptFriendRequest}
                onRejectFriendRequest={handleRejectFriendRequest}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-900 relative">

                {!activeConvId ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-center p-8 z-10">
                        <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-2xl border border-slate-800 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <img src="/logo.png" alt="Logo" className="w-20 h-20 relative z-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Welcome to Melon <span style={{ color: '#FF6B9D' }}>Chat</span> 🍉</h2>
                        <p className="text-slate-400 max-w-md text-lg leading-relaxed">
                            Select a conversation from the sidebar or start a new one to begin messaging.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Top Header */}
                        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900 z-10">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <img src={headerInfo.avatar} alt={headerInfo.title} className="w-10 h-10 rounded-full object-cover" />
                                    {activeConv?.type === ConversationType.DIRECT && (
                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-slate-900 bg-green-500" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-slate-100 font-semibold">{headerInfo.title}</h2>
                                    <p className="text-xs text-slate-400">{headerInfo.subtitle}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4" style={{ color: '#FF6B9D' }}>
                                <button
                                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                                    onClick={() => setIsCallOpen(true)}
                                    title="Phone Call"
                                >
                                    <Phone size={20} />
                                </button>
                                <button
                                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                                    onClick={() => setIsCallOpen(true)}
                                    title="Video Call"
                                >
                                    <Video size={20} />
                                </button>
                                <button
                                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                                    onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                                    title={isRightSidebarOpen ? "Hide Info" : "Show Info"}
                                >
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/50">
                            <div className="flex justify-center mb-4">
                                <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full">Today</span>
                            </div>

                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === currentUser?.id;
                                const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);
                                return (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        isMe={isMe}
                                        sender={users[msg.senderId]}
                                        showAvatar={showAvatar}
                                    />
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900 relative">
                            {/* Emoji Picker Popover */}
                            {showEmojiPicker && (
                                <div
                                    ref={emojiPickerRef}
                                    className="absolute bottom-20 right-20 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 w-72 animate-in slide-in-from-bottom-5 duration-200 z-50"
                                >
                                    <div className="grid grid-cols-6 gap-2">
                                        {EMOJIS.map(emoji => (
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
                                    onChange={handleFileSelect}
                                />

                                <button
                                    className="text-slate-400 p-2 transition-colors melon-button juice-splash"
                                    style={{ '--hover-color': '#FF6B9D' } as React.CSSProperties}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#FF6B9D'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Attach File"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <button
                                    className="text-slate-400 p-2 transition-colors melon-button juice-splash"
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#FF6B9D'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Send Image"
                                >
                                    <ImageIcon size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent text-slate-200 px-4 py-2 focus:outline-none placeholder-slate-500"
                                />
                                <button
                                    className="text-slate-400 p-2 transition-colors melon-button"
                                    style={{ color: showEmojiPicker ? '#FF6B9D' : undefined }}
                                    onMouseEnter={(e) => !showEmojiPicker && (e.currentTarget.style.color = '#FF6B9D')}
                                    onMouseLeave={(e) => !showEmojiPicker && (e.currentTarget.style.color = '#94a3b8')}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                    <Smile size={20} />
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    className={`p-2 rounded-xl ml-2 transition-all melon-button juice-splash ${inputValue.trim() ? 'text-white melon-glow' : 'bg-slate-700 text-slate-500'}`}
                                    style={{ backgroundColor: inputValue.trim() ? '#FF6B9D' : undefined }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Video Call Overlay */}
                <VideoCall
                    isOpen={isCallOpen}
                    onClose={() => setIsCallOpen(false)}
                    peerName={headerInfo.title}
                    peerAvatar={headerInfo.avatar}
                />

            </div>

            {/* Settings Modal */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Optional Right Sidebar (Details) - Toggleable */}
            {activeConvId && isRightSidebarOpen && (
                <div className="hidden lg:block w-80 border-l border-slate-800 bg-slate-900 flex flex-col">
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center mb-6">
                            <img src={headerInfo.avatar} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-slate-800 shadow-lg" alt="Profile" />
                            <h3 className="text-lg font-bold text-slate-100">{headerInfo.title}</h3>
                            <p className="text-sm text-slate-400">{headerInfo.subtitle}</p>
                        </div>

                        {/* Options Section */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">OPTIONS</h4>
                            <ul className="space-y-2">
                                <li className="text-sm text-slate-300 hover:text-white cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors">
                                    Search in Conversation
                                </li>
                                <li className="text-sm text-slate-300 hover:text-white cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors">
                                    Notifications
                                </li>
                                <li className="text-sm text-red-400 hover:text-red-300 cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-800 transition-colors mt-4">
                                    Block User
                                </li>
                            </ul>
                        </div>

                        {/* Media & Files Section */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">MEDIA & FILES</h4>
                            <div className="space-y-4">
                                {/* Images */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-slate-300 font-medium">Images</span>
                                        <span className="text-xs text-slate-500">
                                            {messages.filter(m => m.type === MessageType.IMAGE || m.attachments?.some(a => a.type === 'IMAGE')).length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {messages
                                            .filter(m => m.type === MessageType.IMAGE || m.attachments?.some(a => a.type === 'IMAGE'))
                                            .slice(0, 9)
                                            .map((message) => {
                                                const imageUrl = message.attachments?.find(a => a.type === 'IMAGE')?.url || message.content;
                                                return (
                                                    <div key={message.id} className="aspect-square rounded-lg overflow-hidden bg-slate-800 cursor-pointer hover:opacity-80 transition-opacity">
                                                        <img src={imageUrl} alt="Media" className="w-full h-full object-cover" />
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Files */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-slate-300 font-medium">Files</span>
                                        <span className="text-xs text-slate-500">
                                            {messages.filter(m => m.type === MessageType.FILE || m.attachments?.some(a => a.type === 'FILE')).length}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {messages
                                            .filter(m => m.type === MessageType.FILE || m.attachments?.some(a => a.type === 'FILE'))
                                            .slice(0, 5)
                                            .map((message) => {
                                                const file = message.attachments?.find(a => a.type === 'FILE');
                                                return (
                                                    <div key={message.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
                                                        <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
                                                            <Paperclip size={16} className="text-slate-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-slate-200 truncate">{file?.name || 'File'}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {file?.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
