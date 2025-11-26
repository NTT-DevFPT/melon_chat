package com.chat.controller;

import com.chat.dto.user.UpdateUserRequest;
import com.chat.model.User;
import com.chat.security.UserPrincipal;
import com.chat.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateUserRequest updateRequest) {
        User user = new User();
        user.setFullName(updateRequest.getFullName());
        user.setAvatarUrl(updateRequest.getAvatarUrl());
        user.setBio(updateRequest.getBio());

        User updatedUser = userService.updateUser(currentUser.getId(), user);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String q) {
        List<User> users = userService.searchUsers(q);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
}
