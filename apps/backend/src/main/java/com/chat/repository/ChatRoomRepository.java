package com.chat.repository;

import com.chat.model.ChatRoom;
import com.chat.model.enums.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for ChatRoom entity
 */
@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    /**
     * Find rooms by type
     */
    List<ChatRoom> findByType(ChatRoomType type);

    /**
     * Find rooms created by a user
     */
    List<ChatRoom> findByCreatedBy(UUID userId);

    /**
     * Find all chat rooms for a user (where user is a member)
     */
    @Query("SELECT DISTINCT cr FROM ChatRoom cr " +
            "JOIN RoomMember rm ON cr.id = rm.roomId " +
            "WHERE rm.userId = :userId " +
            "ORDER BY cr.updatedAt DESC")
    List<ChatRoom> findUserChatRooms(@Param("userId") UUID userId);

    /**
     * Find direct message room between two users
     */
    @Query("SELECT cr FROM ChatRoom cr " +
            "WHERE cr.type = 'DIRECT' " +
            "AND cr.id IN (" +
            "  SELECT rm1.roomId FROM RoomMember rm1 " +
            "  WHERE rm1.userId = :user1Id " +
            "  AND rm1.roomId IN (" +
            "    SELECT rm2.roomId FROM RoomMember rm2 " +
            "    WHERE rm2.userId = :user2Id" +
            "  )" +
            ")")
    Optional<ChatRoom> findDirectRoomBetweenUsers(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);
}
