package com.chat.dto.chat;

import com.chat.model.enums.ChatRoomType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ChatRoomResponse {
    private UUID id;
    private ChatRoomType type;
    private String name;
    private String avatarUrl;
    private List<UUID> participants;
    private Long unreadCount;
    private LocalDateTime updatedAt;
    private String lastMessageContent;
    private UUID lastMessageSenderId;
    private UUID lastMessageId;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ChatRoomType getType() {
        return type;
    }

    public void setType(ChatRoomType type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public List<UUID> getParticipants() {
        return participants;
    }

    public void setParticipants(List<UUID> participants) {
        this.participants = participants;
    }

    public Long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(Long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getLastMessageContent() {
        return lastMessageContent;
    }

    public void setLastMessageContent(String lastMessageContent) {
        this.lastMessageContent = lastMessageContent;
    }

    public UUID getLastMessageSenderId() {
        return lastMessageSenderId;
    }

    public void setLastMessageSenderId(UUID lastMessageSenderId) {
        this.lastMessageSenderId = lastMessageSenderId;
    }

    public UUID getLastMessageId() {
        return lastMessageId;
    }

    public void setLastMessageId(UUID lastMessageId) {
        this.lastMessageId = lastMessageId;
    }
}


