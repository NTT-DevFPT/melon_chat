package com.chat.model;

import com.chat.model.enums.RoomMemberRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * RoomMember entity representing user membership in chat rooms
 */
@Entity
@Table(name = "room_members", uniqueConstraints = {
        @UniqueConstraint(name = "uk_room_user", columnNames = { "room_id", "user_id" })
}, indexes = {
        @Index(name = "idx_room_member_user", columnList = "user_id"),
        @Index(name = "idx_room_member_room", columnList = "room_id")
})
public class RoomMember extends BaseEntity {

    @NotNull(message = "Room ID is required")
    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @NotNull(message = "User ID is required")
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull(message = "Role is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private RoomMemberRole role = RoomMemberRole.MEMBER;

    @NotNull(message = "Joined date is required")
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    // Constructors
    public RoomMember() {
        this.joinedAt = LocalDateTime.now();
    }

    public RoomMember(UUID roomId, UUID userId, RoomMemberRole role) {
        this.roomId = roomId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getRoomId() {
        return roomId;
    }

    public void setRoomId(UUID roomId) {
        this.roomId = roomId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public RoomMemberRole getRole() {
        return role;
    }

    public void setRole(RoomMemberRole role) {
        this.role = role;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public LocalDateTime getLastReadAt() {
        return lastReadAt;
    }

    public void setLastReadAt(LocalDateTime lastReadAt) {
        this.lastReadAt = lastReadAt;
    }

    // Helper methods
    public boolean isAdmin() {
        return this.role == RoomMemberRole.ADMIN;
    }

    public void updateLastRead() {
        this.lastReadAt = LocalDateTime.now();
    }
}
