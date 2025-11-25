// Data Transfer Objects
export interface CreateUserDto {
    username: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface SendMessageDto {
    content: string;
    receiverId: string;
}

export interface CreateChatRoomDto {
    participantIds: string[];
}
