package com.chat.exception;

/**
 * Exception thrown when OTP is invalid or expired
 */
public class InvalidOTPException extends RuntimeException {

    public InvalidOTPException(String message) {
        super(message);
    }

    public InvalidOTPException() {
        super("Invalid or expired OTP code");
    }
}
