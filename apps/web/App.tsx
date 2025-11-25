import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { VideoCall } from './components/VideoCall';
import { SettingsModal } from './components/SettingsModal';
import { Phone, Video, MoreVertical, Paperclip, Smile, Send, Image as ImageIcon, X } from 'lucide-react';
import { Conversation, User, Message, UserStatus, ConversationType, MessageType } from './types';

// --- MOCK DATA GENERATION ---
const CURRENT_USER_ID = 'u1';

const MOCK_USERS: Record<string, User> = {
  'u1': { id: 'u1', username: 'alex_dev', fullName: 'Alex Developer', avatarUrl: 'https://picsum.photos/id/64/200/200', status: UserStatus.ONLINE, lastSeen: new Date().toISOString() },
  'u2': { id: 'u2', username: 'sarah_des', fullName: 'Sarah Design', avatarUrl: 'https://picsum.photos/id/65/200/200', status: UserStatus.ONLINE, lastSeen: new Date().toISOString() },
  'u3': { id: 'u3', username: 'mike_pm', fullName: 'Mike Manager', avatarUrl: 'https://picsum.photos/id/91/200/200', status: UserStatus.BUSY, lastSeen: new Date().toISOString() },
  'u4': { id: 'u4', username: 'lisa_qa', fullName: 'Lisa QA', avatarUrl: 'https://picsum.photos/id/177/200/200', status: UserStatus.OFFLINE, lastSeen: new Date().toISOString() },
  'u5': { id: 'u5', username: 'tom_eng', fullName: 'Tom Engineer', avatarUrl: 'https://picsum.photos/id/100/200/200', status: UserStatus.ONLINE, lastSeen: new Date().toISOString() },
  'u6': { id: 'u6', username: 'emily_hr', fullName: 'Emily HR', avatarUrl: 'https://picsum.photos/id/101/200/200', status: UserStatus.AWAY, lastSeen: new Date().toISOString() },
};

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    type: ConversationType.DIRECT,
    participants: ['u1', 'u2'],
    unreadCount: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    type: ConversationType.GROUP,
    name: 'FPT Project Alpha 🚀',
    avatarUrl: 'https://picsum.photos/id/180/200/200',
    participants: ['u1', 'u2', 'u3'],
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'c3',
    type: ConversationType.DIRECT,
    participants: ['u1', 'u4'],
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'c1': [
    { id: 'm1', conversationId: 'c1', senderId: 'u2', type: MessageType.TEXT, content: 'Hey Alex, did you check the new UI mockups?', createdAt: new Date(Date.now() - 100000).toISOString(), status: 'READ' },
    { id: 'm2', conversationId: 'c1', senderId: 'u1', type: MessageType.TEXT, content: 'Yes! They look amazing. I love the orange accent.', createdAt: new Date(Date.now() - 90000).toISOString(), status: 'READ' },
    { id: 'm3', conversationId: 'c1', senderId: 'u2', type: MessageType.IMAGE, content: '', attachments: [{ id: 'a1', type: 'IMAGE', url: 'https://picsum.photos/id/29/400/300', name: 'mockup.png', size: 2048 }], createdAt: new Date(Date.now() - 80000).toISOString(), status: 'READ' },
    { id: 'm4', conversationId: 'c1', senderId: 'u2', type: MessageType.TEXT, content: 'Thanks! I was thinking about animation for the sidebar.', createdAt: new Date(Date.now() - 5000).toISOString(), status: 'DELIVERED' },
    { id: 'm5', conversationId: 'c1', senderId: 'u2', type: MessageType.TEXT, content: 'Are we using Framer Motion?', createdAt: new Date(Date.now() - 1000).toISOString(), status: 'DELIVERED' },
  ],
  'c2': [
    { id: 'm10', conversationId: 'c2', senderId: 'u3', type: MessageType.TEXT, content: 'Team, we are launching in 5 days.', createdAt: new Date(Date.now() - 500000).toISOString(), status: 'READ' },
    { id: 'm11', conversationId: 'c2', senderId: 'u1', type: MessageType.TEXT, content: 'Backend is ready. Kafka consumers are up.', createdAt: new Date(Date.now() - 400000).toISOString(), status: 'READ' },
  ],
  'c3': []
};

const EMOJIS = ["🍉", "😀", "😂", "🤣", "❤️", "😍", "😒", "👌", "😭", "😩", "🫣", "🫡", "🫠", "💀", "🤡", "🤖", "👻", "👽", "💩", "👍", "👎", "🔥", "🎉", "👋", "🙏"];

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('c1');
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: `m_${Date.now()}`,
      conversationId: activeConvId,
      senderId: CURRENT_USER_ID,
      type: MessageType.TEXT,
      content: inputValue,
      createdAt: new Date().toISOString(),
      status: 'SENT',
    };

    setMessages(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMessage]
    }));
    setInputValue('');
    setShowEmojiPicker(false);

    // Simulate receive after 1 sec
    setTimeout(() => {
      setMessages(prev => {
        const convMessages = [...(prev[activeConvId] || [])];
        const idx = convMessages.findIndex(m => m.id === newMessage.id);
        if (idx !== -1) {
          convMessages[idx] = { ...convMessages[idx], status: 'DELIVERED' };
        }
        return { ...prev, [activeConvId]: convMessages };
      });
    }, 1000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');

    const newMessage: Message = {
      id: `m_${Date.now()}`,
      conversationId: activeConvId,
      senderId: CURRENT_USER_ID,
      type: isImage ? MessageType.IMAGE : MessageType.FILE,
      content: isImage ? '' : 'File sent', // Caption could be added later
      attachments: [{
        id: `att_${Date.now()}`,
        url: isImage ? URL.createObjectURL(file) : '#', // Use local object URL for preview
        type: isImage ? 'IMAGE' : 'FILE',
        name: file.name,
        size: file.size
      }],
      createdAt: new Date().toISOString(),
      status: 'SENT',
    };

    setMessages(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMessage]
    }));

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };

  const handleCreateGroup = (name: string, participantIds: string[]) => {
    const newGroupId = `g_${Date.now()}`;
    const newGroup: Conversation = {
      id: newGroupId,
      type: ConversationType.GROUP,
      name: name,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF6B9D&color=fff`,
      participants: [CURRENT_USER_ID, ...participantIds],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    // Add new conversation to list
    setConversations(prev => [newGroup, ...prev]);
    // Initialize message store for this group
    setMessages(prev => ({ ...prev, [newGroupId]: [] }));
    // Select the new group
    setActiveConvId(newGroupId);
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Helper to get chat header info
  const getHeaderInfo = () => {
    if (!activeConv) return { title: 'Select Chat', subtitle: '', avatar: '' };

    if (activeConv.type === ConversationType.GROUP) {
      return {
        title: activeConv.name || 'Group Chat',
        subtitle: `${activeConv.participants.length} participants`,
        avatar: activeConv.avatarUrl || ''
      };
    } else {
      const otherId = activeConv.participants.find(id => id !== CURRENT_USER_ID);
      const user = MOCK_USERS[otherId || ''];
      return {
        title: user?.fullName || 'Unknown',
        subtitle: user?.status === UserStatus.ONLINE ? 'Online' : `Last seen ${new Date(user?.lastSeen || '').toLocaleTimeString()}`,
        avatar: user?.avatarUrl || ''
      };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Watermelon Seed Particles Background */}
      <div className="watermelon-seeds">
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
        <div className="seed"></div>
      </div>

      <Sidebar
        conversations={conversations}
        users={MOCK_USERS}
        currentUserId={CURRENT_USER_ID}
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
            <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/50">
          {/* Date separator example */}
          <div className="flex justify-center mb-4">
            <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full">Today</span>
          </div>

          {messages[activeConvId]?.map((msg, index) => {
            const isMe = msg.senderId === CURRENT_USER_ID;
            const showAvatar = !isMe && (index === 0 || messages[activeConvId][index - 1].senderId !== msg.senderId);
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={isMe}
                sender={MOCK_USERS[msg.senderId]}
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

export default App;