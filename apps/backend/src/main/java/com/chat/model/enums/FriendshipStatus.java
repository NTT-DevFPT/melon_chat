package com.chat.model.enums;

/**
 * Friendship request status
 */
public enum FriendshipStatus {
    /**
     * Friend request is pending approval
     */
    PENDING,

    /**
     * Friend request has been accepted
     */
    ACCEPTED,

    /**
     * Friend request has been rejected
     */
    REJECTED,

    /**
     * User has been blocked
     */
    BLOCKED
}
