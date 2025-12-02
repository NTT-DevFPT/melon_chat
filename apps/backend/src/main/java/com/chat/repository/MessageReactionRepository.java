package com.chat.repository;

import com.chat.model.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for MessageReaction entity
 */
@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, UUID> {

    /**
     * Find all reactions for a specific message
     */
    List<MessageReaction> findByMessageId(UUID messageId);

    /**
     * Find all reactions by a specific user
     */
    List<MessageReaction> findByUserId(UUID userId);

    /**
     * Find a specific reaction by message, user, and emoji
     */
    Optional<MessageReaction> findByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);

    /**
     * Check if a reaction exists
     */
    boolean existsByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);

    /**
     * Delete a specific reaction
     */
    void deleteByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);

    /**
     * Count reactions for a message by emoji
     */
    @Query("SELECT r.emoji, COUNT(r) FROM MessageReaction r " +
           "WHERE r.messageId = :messageId " +
           "GROUP BY r.emoji")
    List<Object[]> countReactionsByEmoji(@Param("messageId") UUID messageId);

    /**
     * Delete all reactions for a message
     */
    void deleteByMessageId(UUID messageId);
}
