package com.chat.dto.user;

import jakarta.validation.constraints.Size;

public class UpdateUserRequest {
    @Size(min = 1, max = 100)
    private String fullName;

    @Size(max = 500)
    private String avatarUrl;

    @Size(max = 500)
    private String bio;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }
}
