package com.chat.repository;

import com.chat.model.Message;
import com.chat.model.enums.MessageStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Message entity
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    /**
     * Find messages in a room (excluding deleted, with pagination)
     */
    List<Message> findByRoomIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID roomId, Pageable pageable);

    /**
     * Find all messages in a room (excluding deleted)
     */
    List<Message> findByRoomIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID roomId);

    /**
     * Find messages sent by a user
     */
    List<Message> findBySenderId(UUID senderId);

    /**
     * Count unread messages in a room for a user
     */
    @Query("SELECT COUNT(m) FROM Message m " +
            "JOIN RoomMember rm ON m.roomId = rm.roomId " +
            "WHERE m.roomId = :roomId " +
            "AND m.senderId != :userId " +
            "AND m.deletedAt IS NULL " +
            "AND (rm.lastReadAt IS NULL OR m.createdAt > rm.lastReadAt) " +
            "AND rm.userId = :userId")
    long countUnreadMessages(@Param("roomId") UUID roomId, @Param("userId") UUID userId);

    /**
     * Find recent messages after a certain time
     */
    @Query("SELECT m FROM Message m " +
            "WHERE m.roomId = :roomId " +
            "AND m.deletedAt IS NULL " +
            "AND m.createdAt > :since " +
            "ORDER BY m.createdAt ASC")
    List<Message> findRecentMessages(@Param("roomId") UUID roomId, @Param("since") LocalDateTime since);

    /**
     * Find last message in a room
     */
    @Query("SELECT m FROM Message m " +
            "WHERE m.roomId = :roomId " +
            "AND m.deletedAt IS NULL " +
            "ORDER BY m.createdAt DESC " +
            "LIMIT 1")
    Message findLastMessage(@Param("roomId") UUID roomId);
}
