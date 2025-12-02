package com.chat.service;

import com.chat.dto.chat.MessageReactionResponse;
import com.chat.exception.DuplicateResourceException;
import com.chat.exception.ResourceNotFoundException;
import com.chat.exception.UnauthorizedException;
import com.chat.model.Message;
import com.chat.model.MessageReaction;
import com.chat.repository.MessageReactionRepository;
import com.chat.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing message reactions
 */
@Service
public class MessageReactionService {

    @Autowired
    private MessageReactionRepository reactionRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatRoomService chatRoomService;

    /**
     * Add a reaction to a message
     */
    @Transactional
    public MessageReactionResponse addReaction(UUID messageId, UUID userId, String emoji) {
        // Verify message exists
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));

        // Verify user is a member of the room
        if (!chatRoomService.isRoomMember(message.getRoomId(), userId)) {
            throw new UnauthorizedException("User is not a member of this conversation");
        }

        // Check if reaction already exists
        if (reactionRepository.existsByMessageIdAndUserIdAndEmoji(messageId, userId, emoji)) {
            throw new DuplicateResourceException("Reaction already exists");
        }

        // Create and save reaction
        MessageReaction reaction = new MessageReaction(messageId, userId, emoji);
        reaction = reactionRepository.save(reaction);

        return mapToResponse(reaction);
    }

    /**
     * Remove a reaction from a message
     */
    @Transactional
    public void removeReaction(UUID messageId, UUID userId, String emoji) {
        // Verify message exists
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found with id: " + messageId));

        // Verify user is a member of the room
        if (!chatRoomService.isRoomMember(message.getRoomId(), userId)) {
            throw new UnauthorizedException("User is not a member of this conversation");
        }

        // Find and delete the reaction
        MessageReaction reaction = reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji)
                .orElseThrow(() -> new ResourceNotFoundException("Reaction not found"));

        reactionRepository.delete(reaction);
    }

    /**
     * Get all reactions for a message
     */
    public List<MessageReactionResponse> getMessageReactions(UUID messageId) {
        List<MessageReaction> reactions = reactionRepository.findByMessageId(messageId);
        return reactions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get reaction counts grouped by emoji for a message
     */
    public Map<String, Long> getReactionCounts(UUID messageId) {
        List<Object[]> results = reactionRepository.countReactionsByEmoji(messageId);
        Map<String, Long> counts = new HashMap<>();
        
        for (Object[] result : results) {
            String emoji = (String) result[0];
            Long count = (Long) result[1];
            counts.put(emoji, count);
        }
        
        return counts;
    }

    /**
     * Get reactions for multiple messages (batch operation)
     */
    public Map<UUID, List<MessageReactionResponse>> getReactionsForMessages(List<UUID> messageIds) {
        Map<UUID, List<MessageReactionResponse>> reactionsMap = new HashMap<>();
        
        for (UUID messageId : messageIds) {
            List<MessageReactionResponse> reactions = getMessageReactions(messageId);
            reactionsMap.put(messageId, reactions);
        }
        
        return reactionsMap;
    }

    /**
     * Map MessageReaction entity to response DTO
     */
    private MessageReactionResponse mapToResponse(MessageReaction reaction) {
        return new MessageReactionResponse(
                reaction.getId(),
                reaction.getMessageId(),
                reaction.getUserId(),
                reaction.getEmoji(),
                reaction.getCreatedAt()
        );
    }
}
