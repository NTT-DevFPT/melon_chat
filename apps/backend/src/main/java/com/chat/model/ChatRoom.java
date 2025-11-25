package com.chat.model;

import com.chat.model.enums.ChatRoomType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * ChatRoom entity representing conversation rooms
 */
@Entity
@Table(name = "chat_rooms")
public class ChatRoom extends BaseEntity {

    @Size(max = 100, message = "Room name must not exceed 100 characters")
    @Column(name = "name", length = 100)
    private String name;

    @NotNull(message = "Room type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ChatRoomType type;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @NotNull(message = "Creator is required")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    // Constructors
    public ChatRoom() {
    }

    public ChatRoom(ChatRoomType type, UUID createdBy) {
        this.type = type;
        this.createdBy = createdBy;
    }

    public ChatRoom(String name, ChatRoomType type, UUID createdBy) {
        this.name = name;
        this.type = type;
        this.createdBy = createdBy;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ChatRoomType getType() {
        return type;
    }

    public void setType(ChatRoomType type) {
        this.type = type;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    // Helper methods
    public boolean isDirectMessage() {
        return this.type == ChatRoomType.DIRECT;
    }

    public boolean isGroupChat() {
        return this.type == ChatRoomType.GROUP;
    }

    @PrePersist
    @PreUpdate
    private void validateRoom() {
        if (this.type == ChatRoomType.GROUP && (this.name == null || this.name.trim().isEmpty())) {
            throw new IllegalStateException("Group chat must have a name");
        }
    }
}
