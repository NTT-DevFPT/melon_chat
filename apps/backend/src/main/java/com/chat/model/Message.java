package com.chat.model;

import com.chat.model.enums.MessageStatus;
import com.chat.model.enums.MessageType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Message entity representing chat messages
 */
@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_message_room_created", columnList = "room_id, created_at"),
        @Index(name = "idx_message_sender", columnList = "sender_id")
})
public class Message extends BaseEntity {

    @NotNull(message = "Room ID is required")
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @NotNull(message = "Sender ID is required")
    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Size(max = 5000, message = "Message content must not exceed 5000 characters")
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @NotNull(message = "Message type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private MessageType type = MessageType.TEXT;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @NotNull(message = "Message status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MessageStatus status = MessageStatus.SENT;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Constructors
    public Message() {
    }

    public Message(UUID roomId, UUID senderId, String content, MessageType type) {
        this.roomId = roomId;
        this.senderId = senderId;
        this.content = content;
        this.type = type;
    }

    // Getters and Setters
    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public UUID getSenderId() {
        return senderId;
    }

    public void setSenderId(UUID senderId) {
        this.senderId = senderId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    public Long getAttachmentSize() {
        return attachmentSize;
    }

    public void setAttachmentSize(Long attachmentSize) {
        this.attachmentSize = attachmentSize;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

    // Helper methods
    public boolean isDeleted() {
        return this.deletedAt != null;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean hasAttachment() {
        return this.attachmentUrl != null && !this.attachmentUrl.trim().isEmpty();
    }

    public void markAsDelivered() {
        if (this.status == MessageStatus.SENT) {
            this.status = MessageStatus.DELIVERED;
        }
    }

    public void markAsRead() {
        this.status = MessageStatus.READ;
    }

    @PrePersist
    @PreUpdate
    private void validateMessage() {
        if (this.type == MessageType.TEXT && (this.content == null || this.content.trim().isEmpty())) {
            throw new IllegalStateException("Text message must have content");
        }
        if ((this.type == MessageType.IMAGE || this.type == MessageType.FILE) &&
                (this.attachmentUrl == null || this.attachmentUrl.trim().isEmpty())) {
            throw new IllegalStateException("Image/File message must have attachment URL");
        }
    }
}
