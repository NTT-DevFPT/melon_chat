package com.chat.dto.chat;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for message reactions
 */
public class MessageReactionResponse {

    private UUID id;
    private UUID messageId;
    private UUID userId;
    private String emoji;
    private LocalDateTime createdAt;

    // Constructors
    public MessageReactionResponse() {
    }

    public MessageReactionResponse(UUID id, UUID messageId, UUID userId, String emoji, LocalDateTime createdAt) {
        this.id = id;
        this.messageId = messageId;
        this.userId = userId;
        this.emoji = emoji;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getMessageId() {
        return messageId;
    }

    public void setMessageId(UUID messageId) {
        this.messageId = messageId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmoji() {
        return emoji;
    }

    public void setEmoji(String emoji) {
        this.emoji = emoji;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
