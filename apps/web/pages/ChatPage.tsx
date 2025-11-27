import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MessageBubble } from '../components/MessageBubble';
import { VideoCall } from '../components/VideoCall';
import { SettingsModal } from '../components/SettingsModal';
import { Phone, Video, MoreVertical, Paperclip, Smile, Send, Image as ImageIcon } from 'lucide-react';
import { Conversation, User, Message, UserStatus, ConversationType, MessageType } from '../types';
import { useAuth } from '../context/AuthContext';
import { client } from '../api/client';
import { toast } from 'react-hot-toast';
import { webSocketService } from '../services/WebSocketService';

const EMOJIS = ["🍉", "😀", "😂", "🤣", "❤️", "😍", "😒", "👌", "😭", "😩", "🫣", "🫡", "🫠", "💀", "🤡", "🤖", "👻", "👽", "💩", "👍", "👎", "🔥", "🎉", "👋", "🙏"];

export const ChatPage: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isCallOpen, setIsCallOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [users, setUsers] = useState<Record<string, User>>({});

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
            webSocketService.subscribe('/user/queue/messages', (message: Message) => {
                // Handle new message
                if (activeConvIdRef.current === message.conversationId) {
                    setMessages(prev => [...prev, message]);
                    // Mark as read? (API call needed)
                } else {
                    // Optional: Show toast notification
                    // toast.success(`New message`);
                }

                // Update conversations list
                setConversations(prev => {
                    const index = prev.findIndex(c => c.id === message.conversationId);
                    if (index !== -1) {
                        const updatedConv = {
                            ...prev[index],
                            updatedAt: message.createdAt,
                            unreadCount: activeConvIdRef.current === message.conversationId ? prev[index].unreadCount : prev[index].unreadCount + 1
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

    // Fetch conversations (Initial only)
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await client.get<Conversation[]>('/chat/rooms');
                setConversations(response.data);
                if (response.data.length > 0 && !activeConvId) {
                    setActiveConvId(response.data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            }
        };
        fetchConversations();
    }, []);

    // Fetch messages for active conversation
    useEffect(() => {
        if (!activeConvId) return;

        const fetchMessages = async () => {
            try {
                const response = await client.get<{ content: Message[] }>(`/chat/rooms/${activeConvId}/messages`);
                // Backend returns Page<Message>, so we access .content
                // We might need to reverse if backend returns newest first
                setMessages(response.data.content.reverse());
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();
    }, [activeConvId]);

    // Fetch participants info (simple version: fetch friends)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await client.get<User[]>('/friendships/friends');
                const newUsers: Record<string, User> = {};
                response.data.forEach(u => newUsers[u.id] = u);
                if (currentUser) newUsers[currentUser.id] = currentUser;
                setUsers(newUsers);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        fetchUsers();
    }, [currentUser]);

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
            await client.post(`/chat/rooms/${activeConvId}/messages`, {
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
            const response = await client.get<{ content: Message[] }>(`/chat/rooms/${activeConvId}/messages`);
            setMessages(response.data.content.reverse());
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
            await client.post('/chat/group', {
                name,
                participantIds
            });
            toast.success("Group created!");
            // Refresh conversations
            const response = await client.get<Conversation[]>('/chat/rooms');
            setConversations(response.data);
        } catch (error) {
            console.error("Failed to create group", error);
            toast.error("Failed to create group");
        }
    };

    const activeConv = conversations.find(c => c.id === activeConvId);

    // Helper to get chat header info
    const getHeaderInfo = () => {
        if (!activeConv) return { title: 'Select Chat', subtitle: '', avatar: '' };

        if (activeConv.type === ConversationType.GROUP) {
            return {
                title: activeConv.name || 'Group Chat',
                subtitle: `${activeConv.participants.length} participants`,
                avatar: activeConv.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConv.name || 'G')}&background=FF6B9D&color=fff`
            };
        } else {
            const otherId = activeConv.participants.find(id => id !== currentUser?.id);
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
                currentUserId={currentUser?.id || ''}
                activeConversationId={activeConvId}
                onSelectConversation={setActiveConvId}
                onCreateGroup={handleCreateGroup}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-900 relative">

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
                        >
                            <Phone size={20} />
                        </button>
                        <button
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                            onClick={() => setIsCallOpen(true)}
                        >
                            <Video size={20} />
                        </button>
                        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400" onClick={logout}>
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

            {/* Optional Right Sidebar (Details) - Hidden on small screens */}
            <div className="hidden lg:block w-72 border-l border-slate-800 bg-slate-900 p-6">
                <div className="flex flex-col items-center">
                    <img src={headerInfo.avatar} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-slate-800 shadow-lg" alt="Profile" />
                    <h3 className="text-lg font-bold text-slate-100">{headerInfo.title}</h3>
                    <p className="text-sm text-slate-400">{headerInfo.subtitle}</p>
                </div>

                <div className="mt-8">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Shared Media</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden">
                            <img src="https://picsum.photos/id/23/200" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer" alt="media" />
                        </div>
                        <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden">
                            <img src="https://picsum.photos/id/45/200" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer" alt="media" />
                        </div>
                        <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center text-slate-500 text-xs font-medium cursor-pointer hover:bg-slate-700 transition-colors">
                            +12
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Options</h4>
                    <ul className="space-y-2">
                        <li className="text-sm text-slate-300 hover:text-white cursor-pointer py-1">Search in Conversation</li>
                        <li className="text-sm text-slate-300 hover:text-white cursor-pointer py-1">Notifications</li>
                        <li className="text-sm text-red-400 hover:text-red-300 cursor-pointer py-1 mt-4">Block User</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
