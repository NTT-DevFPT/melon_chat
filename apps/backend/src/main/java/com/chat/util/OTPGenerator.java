package com.chat.util;

import java.security.SecureRandom;

/**
 * Utility class for generating OTP codes
 */
public class OTPGenerator {

    private static final SecureRandom random = new SecureRandom();
    private static final int OTP_LENGTH = 6;

    /**
     * Generate a 6-digit OTP code
     */
    public static String generate() {
        int otp = random.nextInt(900000) + 100000; // Range: 100000-999999
        return String.valueOf(otp);
    }

    /**
     * Generate OTP with custom length
     */
    public static String generate(int length) {
        if (length <= 0) {
            throw new IllegalArgumentException("OTP length must be positive");
        }

        int min = (int) Math.pow(10, length - 1);
        int max = (int) Math.pow(10, length) - 1;
        int otp = random.nextInt(max - min + 1) + min;

        return String.valueOf(otp);
    }
}
