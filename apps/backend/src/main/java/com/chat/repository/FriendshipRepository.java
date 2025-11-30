package com.chat.repository;

import com.chat.model.Friendship;
import com.chat.model.enums.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Friendship entity
 */
@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    /**
     * Find friendship between two users (directional)
     */
    Optional<Friendship> findByRequesterIdAndReceiverId(UUID requesterId, UUID receiverId);

    /**
     * Find friendships by requester and status
     */
    List<Friendship> findByRequesterIdAndStatus(UUID requesterId, FriendshipStatus status);

    /**
     * Find friendships by receiver and status
     */
    List<Friendship> findByReceiverIdAndStatus(UUID receiverId, FriendshipStatus status);

    /**
     * Find all friendships for a user (both as requester and receiver)
     */
    @Query("SELECT f FROM Friendship f " +
            "WHERE (f.requesterId = :userId OR f.receiverId = :userId) " +
            "AND f.status = :status")
    List<Friendship> findUserFriendships(@Param("userId") UUID userId, @Param("status") FriendshipStatus status);

    /**
     * Find all pending requests received by a user
     */
    @Query("SELECT f FROM Friendship f " +
            "WHERE f.receiverId = :userId " +
            "AND f.status = 'PENDING'")
    List<Friendship> findPendingRequestsForUser(@Param("userId") UUID userId);

    /**
     * Check if friendship exists between two users (bidirectional)
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Friendship f " +
            "WHERE ((f.requesterId = :user1Id AND f.receiverId = :user2Id) " +
            "OR (f.requesterId = :user2Id AND f.receiverId = :user1Id))")
    boolean existsBetweenUsers(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    /**
     * Find friendship between two users (bidirectional)
     */
    @Query("SELECT f FROM Friendship f " +
            "WHERE ((f.requesterId = :user1Id AND f.receiverId = :user2Id) " +
            "OR (f.requesterId = :user2Id AND f.receiverId = :user1Id))")
    Optional<Friendship> findBetweenUsers(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    /**
     * Check if user is blocked by another user
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Friendship f " +
            "WHERE f.receiverId = :userId " +
            "AND f.requesterId = :blockerId " +
            "AND f.status = 'BLOCKED'")
    boolean isUserBlockedBy(@Param("userId") UUID userId, @Param("blockerId") UUID blockerId);

    /**
     * Find all blocked users by a user (where user is the blocker)
     */
    @Query("SELECT f FROM Friendship f " +
            "WHERE f.requesterId = :userId " +
            "AND f.status = 'BLOCKED'")
    List<Friendship> findBlockedUsers(@Param("userId") UUID userId);
}
