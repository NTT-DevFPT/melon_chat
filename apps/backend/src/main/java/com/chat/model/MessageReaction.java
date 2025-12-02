package com.chat.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MessageReaction entity representing emoji reactions to messages
 */
@Entity
@Table(name = "message_reactions", 
       indexes = {
           @Index(name = "idx_reaction_message", columnList = "message_id"),
           @Index(name = "idx_reaction_user", columnList = "user_id")
       },
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_message_user_emoji", 
                           columnNames = {"message_id", "user_id", "emoji"})
       })
public class MessageReaction extends BaseEntity {

    @NotNull(message = "Message ID is required")
    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @NotNull(message = "User ID is required")
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull(message = "Emoji is required")
    @Size(min = 1, max = 10, message = "Emoji must be between 1 and 10 characters")
    @Column(name = "emoji", nullable = false, length = 10)
    private String emoji;

    @NotNull(message = "Created at is required")
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Constructors
    public MessageReaction() {
        this.createdAt = LocalDateTime.now();
    }

    public MessageReaction(UUID messageId, UUID userId, String emoji) {
        this.messageId = messageId;
        this.userId = userId;
        this.emoji = emoji;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
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

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
