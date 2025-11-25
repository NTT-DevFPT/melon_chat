// Shared types and interfaces
export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    createdAt: Date;
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    timestamp: Date;
    read: boolean;
}

export interface ChatRoom {
    id: string;
    participants: User[];
    lastMessage?: Message;
    updatedAt: Date;
}
