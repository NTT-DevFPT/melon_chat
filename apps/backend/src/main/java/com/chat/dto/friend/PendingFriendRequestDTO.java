package com.chat.dto.friend;

import com.chat.model.Friendship;
import com.chat.model.User;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO exposing pending friend requests along with requester info.
 */
public class PendingFriendRequestDTO {

    private UUID id;
    private UUID requesterId;
    private String requesterName;
    private String requesterUsername;
    private String requesterAvatarUrl;
    private LocalDateTime createdAt;

    public PendingFriendRequestDTO() {
    }

    public PendingFriendRequestDTO(Friendship friendship, User requester) {
        this.id = friendship.getId();
        this.requesterId = friendship.getRequesterId();
        this.requesterName = requester != null ? requester.getFullName() : null;
        this.requesterUsername = requester != null ? requester.getUsername() : null;
        this.requesterAvatarUrl = requester != null ? requester.getAvatarUrl() : null;
        this.createdAt = friendship.getCreatedAt();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(UUID requesterId) {
        this.requesterId = requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public String getRequesterUsername() {
        return requesterUsername;
    }

    public void setRequesterUsername(String requesterUsername) {
        this.requesterUsername = requesterUsername;
    }

    public String getRequesterAvatarUrl() {
        return requesterAvatarUrl;
    }

    public void setRequesterAvatarUrl(String requesterAvatarUrl) {
        this.requesterAvatarUrl = requesterAvatarUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}





