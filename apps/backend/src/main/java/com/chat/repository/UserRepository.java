package com.chat.repository;

import com.chat.model.User;
import com.chat.model.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User entity
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Find user by username
     */
    Optional<User> findByUsername(String username);

    /**
     * Find user by email
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if username exists
     */
    boolean existsByUsername(String username);

    /**
     * Check if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Find users by status
     */
    List<User> findByStatus(UserStatus status);

    /**
     * Search users by full name (case-insensitive)
     */
    List<User> findByFullNameContainingIgnoreCase(String fullName);

    /**
     * Search users by username (case-insensitive)
     */
    List<User> findByUsernameContainingIgnoreCase(String username);
}
