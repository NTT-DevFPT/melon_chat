package com.chat.service;

import com.chat.exception.BusinessException;
import com.chat.exception.ResourceNotFoundException;
import com.chat.exception.UnauthorizedException;
import com.chat.model.ChatRoom;
import com.chat.model.RoomMember;
import com.chat.model.User;
import com.chat.model.enums.ChatRoomType;
import com.chat.model.enums.RoomMemberRole;
import com.chat.repository.ChatRoomRepository;
import com.chat.repository.RoomMemberRepository;
import com.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing chat rooms
 */
@Service
public class ChatRoomService {

    private static final Logger logger = LoggerFactory.getLogger(ChatRoomService.class);

    @Autowired
    private ChatRoomRepository chatRoomRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a direct message room between two users
     */
    @Transactional
    public ChatRoom createDirectRoom(UUID user1Id, UUID user2Id) {
        // Check if users exist
        if (!userRepository.existsById(user1Id) || !userRepository.existsById(user2Id)) {
            throw new ResourceNotFoundException("User not found");
        }

        // Check if direct room already exists
        Optional<ChatRoom> existingRoom = chatRoomRepository.findDirectRoomBetweenUsers(user1Id, user2Id);
        if (existingRoom.isPresent()) {
            return existingRoom.get();
        }

        // Create new room
        ChatRoom room = new ChatRoom(ChatRoomType.DIRECT, user1Id);
        ChatRoom savedRoom = chatRoomRepository.save(room);

        // Add members
        RoomMember member1 = new RoomMember(savedRoom.getId(), user1Id, RoomMemberRole.MEMBER);
        RoomMember member2 = new RoomMember(savedRoom.getId(), user2Id, RoomMemberRole.MEMBER);

        roomMemberRepository.save(member1);
        roomMemberRepository.save(member2);

        logger.info("Created direct room between {} and {}", user1Id, user2Id);
        return savedRoom;
    }

    /**
     * Create a group chat room
     */
    @Transactional
    public ChatRoom createGroupRoom(String name, UUID creatorId, List<UUID> memberIds) {
        // Check creator
        if (!userRepository.existsById(creatorId)) {
            throw new ResourceNotFoundException("User", "id", creatorId);
        }

        // Create room
        ChatRoom room = new ChatRoom(name, ChatRoomType.GROUP, creatorId);
        ChatRoom savedRoom = chatRoomRepository.save(room);

        // Add creator as admin
        RoomMember creatorMember = new RoomMember(savedRoom.getId(), creatorId, RoomMemberRole.ADMIN);
        roomMemberRepository.save(creatorMember);

        // Add other members
        for (UUID memberId : memberIds) {
            if (!memberId.equals(creatorId) && userRepository.existsById(memberId)) {
                RoomMember member = new RoomMember(savedRoom.getId(), memberId, RoomMemberRole.MEMBER);
                roomMemberRepository.save(member);
            }
        }

        logger.info("Created group room '{}' by {}", name, creatorId);
        return savedRoom;
    }

    /**
     * Get room by ID
     */
    public ChatRoom getRoomById(UUID roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", "id", roomId));
    }

    /**
     * Get all rooms for a user
     */
    public List<ChatRoom> getUserRooms(UUID userId) {
        return chatRoomRepository.findUserChatRooms(userId);
    }

    /**
     * Add member to group
     */
    @Transactional
    public void addMember(UUID roomId, UUID userId, UUID addedBy) {
        ChatRoom room = getRoomById(roomId);

        // Only for groups
        if (room.getType() != ChatRoomType.GROUP) {
            throw new BusinessException("Cannot add members to direct message room");
        }

        // Check permissions (only admin or members can add? usually admin)
        // For now, let's allow any member to add, or restrict to admin
        // Let's restrict to admin for better control
        if (!isRoomAdmin(roomId, addedBy)) {
            throw new UnauthorizedException("Only group admins can add members");
        }

        // Check if already member
        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new BusinessException("User is already a member of this room");
        }

        // Add member
        RoomMember member = new RoomMember(roomId, userId, RoomMemberRole.MEMBER);
        roomMemberRepository.save(member);

        logger.info("Added user {} to room {} by {}", userId, roomId, addedBy);
    }

    /**
     * Remove member from group
     */
    @Transactional
    public void removeMember(UUID roomId, UUID userId, UUID removedBy) {
        ChatRoom room = getRoomById(roomId);

        if (room.getType() != ChatRoomType.GROUP) {
            throw new BusinessException("Cannot remove members from direct message room");
        }

        // Check permissions: Admin can remove anyone, User can remove themselves
        // (leave)
        boolean isSelf = userId.equals(removedBy);
        boolean isAdmin = isRoomAdmin(roomId, removedBy);

        if (!isSelf && !isAdmin) {
            throw new UnauthorizedException("You do not have permission to remove this member");
        }

        // Cannot remove the last admin if there are other members?
        // Or if creator leaves, assign new admin?
        // For simplicity: if admin leaves, random member becomes admin or room stays
        // without admin (bad)
        // Let's just delete membership

        roomMemberRepository.deleteByRoomIdAndUserId(roomId, userId);
        logger.info("Removed user {} from room {} by {}", userId, roomId, removedBy);

        // If room empty, delete room?
        if (roomMemberRepository.countByRoomId(roomId) == 0) {
            chatRoomRepository.deleteById(roomId);
            logger.info("Deleted empty room {}", roomId);
        }
    }

    /**
     * Update group name
     */
    @Transactional
    public ChatRoom updateRoomName(UUID roomId, String name, UUID userId) {
        ChatRoom room = getRoomById(roomId);

        if (room.getType() != ChatRoomType.GROUP) {
            throw new BusinessException("Cannot rename direct message room");
        }

        if (!isRoomMember(roomId, userId)) {
            throw new UnauthorizedException("You are not a member of this room");
        }

        room.setName(name);
        return chatRoomRepository.save(room);
    }

    /**
     * Update group avatar
     */
    @Transactional
    public ChatRoom updateRoomAvatar(UUID roomId, String avatarUrl, UUID userId) {
        ChatRoom room = getRoomById(roomId);

        if (room.getType() != ChatRoomType.GROUP) {
            throw new BusinessException("Cannot change avatar of direct message room");
        }

        if (!isRoomMember(roomId, userId)) {
            throw new UnauthorizedException("You are not a member of this room");
        }

        room.setAvatarUrl(avatarUrl);
        return chatRoomRepository.save(room);
    }

    /**
     * Check if user is room admin
     */
    public boolean isRoomAdmin(UUID roomId, UUID userId) {
        return roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .map(RoomMember::isAdmin)
                .orElse(false);
    }

    /**
     * Check if user is room member
     */
    public boolean isRoomMember(UUID roomId, UUID userId) {
        return roomMemberRepository.existsByRoomIdAndUserId(roomId, userId);
    }

    /**
     * Get room members
     */
    public List<User> getRoomMembers(UUID roomId) {
        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        List<User> users = new ArrayList<>();

        for (RoomMember member : members) {
            userRepository.findById(member.getUserId()).ifPresent(users::add);
        }

        return users;
    }
}
