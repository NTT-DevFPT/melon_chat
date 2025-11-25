package com.chat.exception;

/**
 * Exception thrown when user lacks required permissions
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException() {
        super("You do not have permission to perform this action");
    }
}
