package com.chat.service;

import com.chat.exception.ResourceNotFoundException;
import com.chat.exception.UnauthorizedException;
import com.chat.model.Message;
import com.chat.model.RoomMember;
import com.chat.model.enums.MessageStatus;
import com.chat.model.enums.MessageType;
import com.chat.repository.MessageRepository;
import com.chat.repository.RoomMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling messages
 */
@Service
public class MessageService {

    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private RoomMemberRepository roomMemberRepository;

    @Autowired
    private ChatRoomService chatRoomService;

    /**
     * Send a text message
     */
    @Transactional
    public Message sendTextMessage(UUID roomId, UUID senderId, String content) {
        // Verify membership
        if (!chatRoomService.isRoomMember(roomId, senderId)) {
            throw new UnauthorizedException("You are not a member of this room");
        }

        Message message = new Message(roomId, senderId, content, MessageType.TEXT);
        Message savedMessage = messageRepository.save(message);

        logger.info("Text message sent in room {} by {}", roomId, senderId);
        return savedMessage;
    }

    /**
     * Send a file/image message
     */
    @Transactional
    public Message sendFileMessage(UUID roomId, UUID senderId, String fileUrl, String fileName, Long fileSize,
            MessageType type) {
        // Verify membership
        if (!chatRoomService.isRoomMember(roomId, senderId)) {
            throw new UnauthorizedException("You are not a member of this room");
        }

        Message message = new Message(roomId, senderId, null, type);
        message.setAttachmentUrl(fileUrl);
        message.setAttachmentName(fileName);
        message.setAttachmentSize(fileSize);

        Message savedMessage = messageRepository.save(message);

        logger.info("File message sent in room {} by {}", roomId, senderId);
        return savedMessage;
    }

    /**
     * Get messages for a room with pagination
     */
    public List<Message> getRoomMessages(UUID roomId, UUID userId, int page, int size) {
        // Verify membership
        if (!chatRoomService.isRoomMember(roomId, userId)) {
            throw new UnauthorizedException("You are not a member of this room");
        }

        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByRoomIdAndDeletedAtIsNullOrderByCreatedAtDesc(roomId, pageable);
    }

    /**
     * Get recent messages (polling)
     */
    public List<Message> getRecentMessages(UUID roomId, UUID userId, LocalDateTime since) {
        // Verify membership
        if (!chatRoomService.isRoomMember(roomId, userId)) {
            throw new UnauthorizedException("You are not a member of this room");
        }

        return messageRepository.findRecentMessages(roomId, since);
    }

    /**
     * Mark message as read
     */
    @Transactional
    public void markAsRead(UUID roomId, UUID userId) {
        // Update last read timestamp in RoomMember
        RoomMember member = roomMemberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this room"));

        member.updateLastRead();
        roomMemberRepository.save(member);

        // Also update message status?
        // For simplicity, we track read status via RoomMember.lastReadAt vs
        // Message.createdAt
        // But if we want per-message status, we'd need a separate table
        // MessageReadStatus
        // The current Message.status is simplistic (only tracks if *anyone* read it or
        // global status)
        // Let's just update the member's last read time for now.
    }

    /**
     * Delete message (soft delete)
     */
    @Transactional
    public void deleteMessage(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        // Only sender can delete
        if (!message.getSenderId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own messages");
        }

        message.softDelete();
        messageRepository.save(message);

        logger.info("Message {} deleted by {}", messageId, userId);
    }

    /**
     * Get unread count for a room
     */
    public long getUnreadCount(UUID roomId, UUID userId) {
        return messageRepository.countUnreadMessages(roomId, userId);
    }

    /**
     * Get last message in room
     */
    public Message getLastMessage(UUID roomId) {
        return messageRepository.findLastMessage(roomId);
    }
}
