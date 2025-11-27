package com.chat.model.enums;

/**
 * Message content types
 */
public enum MessageType {
    /**
     * Plain text message
     */
    TEXT,

    /**
     * Image attachment
     */
    IMAGE,

    /**
     * File attachment
     */
    FILE,

    /**
     * System generated message (user joined, left, etc.)
     */
    SYSTEM
}
