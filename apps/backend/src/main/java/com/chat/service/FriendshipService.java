package com.chat.service;

import com.chat.dto.friend.PendingFriendRequestDTO;
import com.chat.exception.BusinessException;
import com.chat.exception.DuplicateResourceException;
import com.chat.exception.ResourceNotFoundException;
import com.chat.model.Friendship;
import com.chat.model.User;
import com.chat.model.enums.FriendshipStatus;
import com.chat.repository.FriendshipRepository;
import com.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing friendships
 */
@Service
public class FriendshipService {

    private static final Logger logger = LoggerFactory.getLogger(FriendshipService.class);

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Send friend request
     */
    @Transactional
    public Friendship sendFriendRequest(UUID requesterId, UUID receiverId) {
        // Validate users
        if (!userRepository.existsById(requesterId) || !userRepository.existsById(receiverId)) {
            throw new ResourceNotFoundException("User not found");
        }

        // Cannot request yourself
        if (requesterId.equals(receiverId)) {
            throw new BusinessException("Cannot send friend request to yourself");
        }

        // Check existing friendship
        if (friendshipRepository.existsBetweenUsers(requesterId, receiverId)) {
            throw new DuplicateResourceException("Friendship already exists or is pending");
        }

        Friendship friendship = new Friendship(requesterId, receiverId);
        Friendship saved = friendshipRepository.save(friendship);

        logger.info("Friend request sent from {} to {}", requesterId, receiverId);
        return saved;
    }

    /**
     * Accept friend request
     */
    @Transactional
    public Friendship acceptFriendRequest(UUID friendshipId, UUID userId) {
        Friendship friendship = getFriendshipById(friendshipId);

        // Only receiver can accept
        if (!friendship.getReceiverId().equals(userId)) {
            throw new BusinessException("Only the receiver can accept the friend request");
        }

        friendship.accept();
        Friendship saved = friendshipRepository.save(friendship);

        logger.info("Friend request {} accepted by {}", friendshipId, userId);
        return saved;
    }

    /**
     * Reject friend request
     */
    @Transactional
    public void rejectFriendRequest(UUID friendshipId, UUID userId) {
        Friendship friendship = getFriendshipById(friendshipId);

        // Only receiver can reject
        if (!friendship.getReceiverId().equals(userId)) {
            throw new BusinessException("Only the receiver can reject the friend request");
        }

        friendship.reject();
        friendshipRepository.save(friendship);

        logger.info("Friend request {} rejected by {}", friendshipId, userId);

        // Optionally delete the record instead of keeping it as REJECTED
        // friendshipRepository.delete(friendship);
    }

    /**
     * Block user
     */
    @Transactional
    public void blockUser(UUID blockerId, UUID blockedId) {
        // Check if friendship exists
        Optional<Friendship> existing = friendshipRepository.findBetweenUsers(blockerId, blockedId);

        if (existing.isPresent()) {
            Friendship friendship = existing.get();
            friendship.setRequesterId(blockerId); // Ensure blocker is requester for BLOCKED status logic
            friendship.setReceiverId(blockedId);
            friendship.block();
            friendshipRepository.save(friendship);
        } else {
            // Create new blocked relationship
            Friendship friendship = new Friendship(blockerId, blockedId);
            friendship.block();
            friendshipRepository.save(friendship);
        }

        logger.info("User {} blocked {}", blockerId, blockedId);
    }

    /**
     * Unblock user
     */
    @Transactional
    public void unblockUser(UUID unblockerId, UUID blockedId) {
        Friendship friendship = friendshipRepository.findByRequesterIdAndReceiverId(unblockerId, blockedId)
                .orElseThrow(() -> new ResourceNotFoundException("Block relationship not found"));

        if (!friendship.isBlocked()) {
            throw new BusinessException("User is not blocked");
        }

        friendshipRepository.delete(friendship);
        logger.info("User {} unblocked {}", unblockerId, blockedId);
    }

    /**
     * Get accepted friends
     */
    public List<User> getFriends(UUID userId) {
        List<Friendship> friendships = friendshipRepository.findUserFriendships(userId, FriendshipStatus.ACCEPTED);
        List<User> friends = new ArrayList<>();

        for (Friendship f : friendships) {
            try {
                UUID friendId = f.getOtherUser(userId);
                userRepository.findById(friendId).ifPresent(friends::add);
            } catch (Exception e) {
                logger.error("Error processing friendship {}: {}", f.getId(), e.getMessage());
            }
        }

        return friends;
    }

    /**
     * Get pending requests (received)
     */
    public List<PendingFriendRequestDTO> getPendingRequests(UUID userId) {
        List<Friendship> pending = friendshipRepository.findPendingRequestsForUser(userId);
        if (pending.isEmpty()) {
            return List.of();
        }

        List<UUID> requesterIds = pending.stream()
                .map(Friendship::getRequesterId)
                .distinct()
                .collect(Collectors.toList());

        Map<UUID, User> requesterMap = userRepository.findAllById(requesterIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        return pending.stream()
                .map(friendship -> {
                    User requester = requesterMap.get(friendship.getRequesterId());
                    if (requester == null) {
                        logger.warn("Requester {} not found for friendship {}", friendship.getRequesterId(), friendship.getId());
                        return null;
                    }
                    return new PendingFriendRequestDTO(friendship, requester);
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    /**
     * Remove friend
     */
    @Transactional
    public void removeFriend(UUID userId, UUID friendId) {
        Friendship friendship = friendshipRepository.findBetweenUsers(userId, friendId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship not found"));

        if (!friendship.isAccepted()) {
            throw new BusinessException("Users are not friends");
        }

        friendshipRepository.delete(friendship);
        logger.info("Friendship removed between {} and {}", userId, friendId);
    }

    /**
     * Check if users are friends
     */
    public boolean areFriends(UUID user1Id, UUID user2Id) {
        return friendshipRepository.findBetweenUsers(user1Id, user2Id)
                .map(Friendship::isAccepted)
                .orElse(false);
    }

    private Friendship getFriendshipById(UUID id) {
        return friendshipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship", "id", id));
    }
}
