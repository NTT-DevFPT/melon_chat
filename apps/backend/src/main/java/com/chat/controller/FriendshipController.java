package com.chat.controller;

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
        List<User> friends = friendshipService.getFriends(currentUser.getId());
        return ResponseEntity.ok(friends);
    }

    @GetMapping("/requests")
    public ResponseEntity<List<Friendship>> getPendingRequests(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Friendship> requests = friendshipService.getPendingRequests(currentUser.getId());
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
}
