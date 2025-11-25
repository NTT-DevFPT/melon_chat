package com.chat.model;

import com.chat.model.enums.FriendshipStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Friendship entity representing friend relationships between users
 */
@Entity
@Table(name = "friendships", uniqueConstraints = {
        @UniqueConstraint(name = "uk_requester_receiver", columnNames = { "requester_id", "receiver_id" })
}, indexes = {
        @Index(name = "idx_friendship_requester", columnList = "requester_id"),
        @Index(name = "idx_friendship_receiver", columnList = "receiver_id"),
        @Index(name = "idx_friendship_status", columnList = "status")
})
public class Friendship extends BaseEntity {

    @NotNull(message = "Requester ID is required")
    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @NotNull(message = "Receiver ID is required")
    @Column(name = "receiver_id", nullable = false)
    private UUID receiverId;

    @NotNull(message = "Friendship status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FriendshipStatus status = FriendshipStatus.PENDING;

    // Constructors
    public Friendship() {
    }

    public Friendship(UUID requesterId, UUID receiverId) {
        this.requesterId = requesterId;
        this.receiverId = receiverId;
        this.status = FriendshipStatus.PENDING;
    }

    // Getters and Setters
    public UUID getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(UUID requesterId) {
        this.requesterId = requesterId;
    }

    public UUID getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(UUID receiverId) {
        this.receiverId = receiverId;
    }

    public FriendshipStatus getStatus() {
        return status;
    }

    public void setStatus(FriendshipStatus status) {
        this.status = status;
    }

    // Helper methods
    public boolean isPending() {
        return this.status == FriendshipStatus.PENDING;
    }

    public boolean isAccepted() {
        return this.status == FriendshipStatus.ACCEPTED;
    }

    public boolean isBlocked() {
        return this.status == FriendshipStatus.BLOCKED;
    }

    public void accept() {
        if (this.status == FriendshipStatus.PENDING) {
            this.status = FriendshipStatus.ACCEPTED;
        } else {
            throw new IllegalStateException("Only pending friendship requests can be accepted");
        }
    }

    public void reject() {
        if (this.status == FriendshipStatus.PENDING) {
            this.status = FriendshipStatus.REJECTED;
        } else {
            throw new IllegalStateException("Only pending friendship requests can be rejected");
        }
    }

    public void block() {
        this.status = FriendshipStatus.BLOCKED;
    }

    public boolean involves(UUID userId) {
        return this.requesterId.equals(userId) || this.receiverId.equals(userId);
    }

    public UUID getOtherUser(UUID userId) {
        if (this.requesterId.equals(userId)) {
            return this.receiverId;
        } else if (this.receiverId.equals(userId)) {
            return this.requesterId;
        }
        throw new IllegalArgumentException("User is not part of this friendship");
    }

    @PrePersist
    @PreUpdate
    private void validateFriendship() {
        if (this.requesterId.equals(this.receiverId)) {
            throw new IllegalStateException("Cannot create friendship with yourself");
        }
    }
}
