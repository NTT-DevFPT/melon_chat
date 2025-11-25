package com.chat.service;

import com.chat.exception.InvalidOTPException;
import com.chat.exception.RateLimitExceededException;
import com.chat.model.OTP;
import com.chat.model.enums.OTPType;
import com.chat.repository.OTPRepository;
import com.chat.util.OTPGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for OTP generation and verification
 */
@Service
public class OTPService {

    private static final Logger logger = LoggerFactory.getLogger(OTPService.class);
    private static final int OTP_VALIDITY_MINUTES = 10;
    private static final int MAX_OTP_PER_HOUR = 5;

    @Autowired
    private OTPRepository otpRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Generate and send OTP
     */
    @Transactional
    public void generateAndSendOTP(String email, OTPType type) {
        // Check rate limit
        checkRateLimit(email, type);

        // Generate OTP code
        String code = OTPGenerator.generate();

        // Create OTP entity
        OTP otp = new OTP(code, email, type, OTP_VALIDITY_MINUTES);
        otpRepository.save(otp);

        // Send email
        try {
            emailService.sendOTPEmail(email, code, type);
            logger.info("OTP sent to email: {} for type: {}", email, type);
        } catch (Exception e) {
            logger.error("Failed to send OTP email to: {}", email, e);
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }

    /**
     * Verify OTP code
     */
    @Transactional
    public boolean verifyOTP(String email, String code, OTPType type) {
        OTP otp = otpRepository.findByEmailAndCodeAndType(email, code, type)
                .orElseThrow(() -> new InvalidOTPException("Invalid OTP code"));

        if (!otp.isValid()) {
            throw new InvalidOTPException("OTP has expired or already been used");
        }

        // Mark as used
        otp.markAsUsed();
        otpRepository.save(otp);

        logger.info("OTP verified successfully for email: {}", email);
        return true;
    }

    /**
     * Check rate limit for OTP requests
     */
    private void checkRateLimit(String email, OTPType type) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long count = otpRepository.countByEmailAndTypeAndCreatedAtAfter(email, type, oneHourAgo);

        if (count >= MAX_OTP_PER_HOUR) {
            throw new RateLimitExceededException(
                    String.format("Too many OTP requests. Maximum %d requests per hour allowed", MAX_OTP_PER_HOUR));
        }
    }

    /**
     * Clean up expired OTPs (runs every hour)
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredOTPs() {
        LocalDateTime now = LocalDateTime.now();
        otpRepository.deleteByExpiresAtBefore(now);
        logger.info("Cleaned up expired OTPs");
    }

    /**
     * Get all OTPs for an email (for testing/debugging)
     */
    public List<OTP> getOTPsByEmail(String email) {
        return otpRepository.findByEmail(email);
    }
}
