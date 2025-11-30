package com.chat.controller;

import com.chat.dto.friend.PendingFriendRequestDTO;
import com.chat.model.Friendship;
import com.chat.model.User;
import com.chat.security.UserPrincipal;
import com.chat.service.FriendshipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friendships")
public class FriendshipController {

    @Autowired
    private FriendshipService friendshipService;

    @PostMapping("/request/{userId}")
    public ResponseEntity<Friendship> sendFriendRequest(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID userId) {
        Friendship friendship = friendshipService.sendFriendRequest(currentUser.getId(), userId);
        return ResponseEntity.ok(friendship);
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Friendship> acceptFriendRequest(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID id) {
        Friendship friendship = friendshipService.acceptFriendRequest(id, currentUser.getId());
        return ResponseEntity.ok(friendship);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectFriendRequest(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID id) {
        friendshipService.rejectFriendRequest(id, currentUser.getId());
        return ResponseEntity.ok("Friend request rejected");
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> unfriend(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID userId) {
        friendshipService.removeFriend(currentUser.getId(), userId);
        return ResponseEntity.ok("Unfriended successfully");
    }

    @GetMapping
    public ResponseEntity<List<User>> getFriends(@AuthenticationPrincipal UserPrincipal currentUser) {
        System.out.println("Getting friends for user: " + currentUser.getId());
        try {
            List<User> friends = friendshipService.getFriends(currentUser.getId());
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            System.out.println("Error getting friends for user: " + currentUser.getId());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<List<PendingFriendRequestDTO>> getPendingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<PendingFriendRequestDTO> requests = friendshipService.getPendingRequests(currentUser.getId());
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/block/{userId}")
    public ResponseEntity<?> blockUser(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID userId) {
        friendshipService.blockUser(currentUser.getId(), userId);
        return ResponseEntity.ok("User blocked successfully");
    }

    @DeleteMapping("/block/{userId}")
    public ResponseEntity<?> unblockUser(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID userId) {
        friendshipService.unblockUser(currentUser.getId(), userId);
        return ResponseEntity.ok("User unblocked successfully");
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<User>> getBlockedUsers(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<User> blockedUsers = friendshipService.getBlockedUsers(currentUser.getId());
        return ResponseEntity.ok(blockedUsers);
    }

    @GetMapping("/blocked-by/{userId}")
    public ResponseEntity<Boolean> isBlockedBy(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID userId) {
        boolean isBlocked = friendshipService.isBlockedBy(currentUser.getId(), userId);
        return ResponseEntity.ok(isBlocked);
    }
}
