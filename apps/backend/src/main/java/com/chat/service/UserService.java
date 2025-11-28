package com.chat.service;

import com.chat.exception.DuplicateResourceException;
import com.chat.exception.InvalidCredentialsException;
import com.chat.exception.ResourceNotFoundException;
import com.chat.model.User;
import com.chat.model.enums.UserRole;
import com.chat.model.enums.UserStatus;
import com.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for user management
 */
@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Create new user
     */
    @Transactional
    public User createUser(User user) {
        // Validate username uniqueness
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new DuplicateResourceException("User", "username", user.getUsername());
        }

        // Validate email uniqueness
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new DuplicateResourceException("User", "email", user.getEmail());
        }

        // Hash password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Set defaults
        if (user.getRole() == null) {
            user.setRole(UserRole.USER);
        }
        if (user.getStatus() == null) {
            user.setStatus(UserStatus.OFFLINE);
        }

        // Set default avatar if not provided
        if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
            String defaultAvatar = String.format(
                    "https://ui-avatars.com/api/?name=%s&background=f0f0f0&color=999999&size=200",
                    user.getFullName().replace(" ", "+"));
            user.setAvatarUrl(defaultAvatar);
        }

        User savedUser = userRepository.save(user);
        logger.info("Created new user: {}", savedUser.getUsername());

        return savedUser;
    }

    /**
     * Get user by ID
     */
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    /**
     * Get user by username
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    /**
     * Get user by email
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    /**
     * Update user information
     */
    @Transactional
    public User updateUser(UUID id, User updatedUser) {
        User user = getUserById(id);

        // Update allowed fields
        if (updatedUser.getFullName() != null) {
            user.setFullName(updatedUser.getFullName());
        }
        if (updatedUser.getAvatarUrl() != null) {
            user.setAvatarUrl(updatedUser.getAvatarUrl());
        }
        if (updatedUser.getBio() != null) {
            user.setBio(updatedUser.getBio());
        }

        User saved = userRepository.save(user);
        logger.info("Updated user: {}", user.getUsername());

        return saved;
    }

    /**
     * Update user status
     */
    @Transactional
    public User updateUserStatus(UUID id, UserStatus status) {
        User user = getUserById(id);
        user.setStatus(status);

        if (status == UserStatus.ONLINE) {
            user.updateLastSeen();
        }

        return userRepository.save(user);
    }

    /**
     * Search users by name or username
     */
    public List<User> searchUsers(String query) {
        List<User> byName = userRepository.findByFullNameContainingIgnoreCase(query);
        List<User> byUsername = userRepository.findByUsernameContainingIgnoreCase(query);

        // Combine and remove duplicates
        byName.addAll(byUsername);
        return byName.stream().distinct().toList();
    }

    /**
     * Get all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get users by status
     */
    public List<User> getUsersByStatus(UserStatus status) {
        return userRepository.findByStatus(status);
    }

    /**
     * Verify email
     */
    @Transactional
    public User verifyEmail(UUID userId) {
        User user = getUserById(userId);
        user.setIsEmailVerified(true);

        User saved = userRepository.save(user);
        logger.info("Email verified for user: {}", user.getUsername());

        return saved;
    }

    /**
     * Verify email by email address
     */
    @Transactional
    public User verifyEmailByEmail(String email) {
        User user = getUserByEmail(email);
        user.setIsEmailVerified(true);

        User saved = userRepository.save(user);
        logger.info("Email verified for user: {}", user.getUsername());

        return saved;
    }

    /**
     * Change password
     */
    @Transactional
    public void changePassword(UUID userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        logger.info("Password changed for user: {}", user.getUsername());
    }

    /**
     * Reset password (without old password verification)
     */
    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = getUserByEmail(email);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        logger.info("Password reset for user: {}", user.getUsername());
    }

    /**
     * Verify user credentials (for login)
     */
    public User verifyCredentials(String username, String password) {
        User user = getUserByUsername(username);

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        if (!user.getIsActive()) {
            throw new InvalidCredentialsException("Account is inactive");
        }

        return user;
    }

    /**
     * Deactivate user account
     */
    @Transactional
    public void deactivateUser(UUID userId) {
        User user = getUserById(userId);
        user.setIsActive(false);
        user.setStatus(UserStatus.OFFLINE);
        userRepository.save(user);

        logger.info("Deactivated user: {}", user.getUsername());
    }

    /**
     * Activate user account
     */
    @Transactional
    public void activateUser(UUID userId) {
        User user = getUserById(userId);
        user.setIsActive(true);
        userRepository.save(user);

        logger.info("Activated user: {}", user.getUsername());
    }

    /**
     * Update last seen timestamp
     */
    @Transactional
    public void updateLastSeen(UUID userId) {
        User user = getUserById(userId);
        user.updateLastSeen();
        userRepository.save(user);
    }
}
