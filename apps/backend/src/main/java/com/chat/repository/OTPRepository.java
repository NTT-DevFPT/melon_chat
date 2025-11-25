package com.chat.repository;

import com.chat.model.OTP;
import com.chat.model.enums.OTPType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for OTP entity
 */
@Repository
public interface OTPRepository extends JpaRepository<OTP, UUID> {

    /**
     * Find OTP by email, code, and type
     */
    Optional<OTP> findByEmailAndCodeAndType(String email, String code, OTPType type);

    /**
     * Find all OTPs for an email and type
     */
    List<OTP> findByEmailAndType(String email, OTPType type);

    /**
     * Find OTPs by email
     */
    List<OTP> findByEmail(String email);

    /**
     * Delete expired OTPs
     */
    void deleteByExpiresAtBefore(LocalDateTime dateTime);

    /**
     * Count OTPs created after a certain time for rate limiting
     */
    long countByEmailAndTypeAndCreatedAtAfter(String email, OTPType type, LocalDateTime after);
}
