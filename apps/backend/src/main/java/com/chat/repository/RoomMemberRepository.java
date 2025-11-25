package com.chat.repository;

import com.chat.model.RoomMember;
import com.chat.model.enums.RoomMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for RoomMember entity
 */
@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {

    /**
     * Find all members of a room
     */
    List<RoomMember> findByRoomId(UUID roomId);

    /**
     * Find all rooms a user is member of
     */
    List<RoomMember> findByUserId(UUID userId);

    /**
     * Find specific room membership
     */
    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);

    /**
     * Check if user is member of a room
     */
    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);

    /**
     * Count members in a room
     */
    long countByRoomId(UUID roomId);

    /**
     * Find members by role in a room
     */
    List<RoomMember> findByRoomIdAndRole(UUID roomId, RoomMemberRole role);

    /**
     * Delete room membership
     */
    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);

    /**
     * Delete all members of a room
     */
    void deleteByRoomId(UUID roomId);
}
