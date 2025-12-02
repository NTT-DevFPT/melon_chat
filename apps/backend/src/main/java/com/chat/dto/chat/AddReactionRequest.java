package com.chat.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for adding a reaction to a message
 */
public class AddReactionRequest {

    @NotBlank(message = "Emoji is required")
    @Size(min = 1, max = 10, message = "Emoji must be between 1 and 10 characters")
    private String emoji;

    // Constructors
    public AddReactionRequest() {
    }

    public AddReactionRequest(String emoji) {
        this.emoji = emoji;
    }

    // Getters and Setters
    public String getEmoji() {
        return emoji;
    }

    public void setEmoji(String emoji) {
        this.emoji = emoji;
    }
}
