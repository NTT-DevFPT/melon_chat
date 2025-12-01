package com.chat.controller;

import com.chat.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final StorageService storageService;

    private final com.chat.repository.RoomMemberRepository roomMemberRepository;
    private final com.chat.repository.UserRepository userRepository;

    @PostMapping("/presigned-url")
    public ResponseEntity<StorageService.PresignedUrlResponse> getPresignedUrl(
            @RequestBody Map<String, String> payload) {
        String fileName = payload.get("fileName");
        String contentType = payload.get("contentType");
        String roomIdStr = payload.get("roomId");

        if (fileName == null || contentType == null || roomIdStr == null) {
            return ResponseEntity.badRequest().build();
        }

        java.util.UUID roomId = java.util.UUID.fromString(roomIdStr);

        // Fetch all members of the room to construct the folder name
        java.util.List<com.chat.model.RoomMember> members = roomMemberRepository.findByRoomId(roomId);

        // Get usernames and sort them alphabetically
        java.util.List<String> usernames = members.stream()
                .map(member -> userRepository.findById(member.getUserId())
                        .map(com.chat.model.User::getUsername)
                        .orElse("unknown"))
                .sorted()
                .collect(java.util.stream.Collectors.toList());

        String folderName = String.join("-", usernames) + "-" + roomId;

        // Determine subfolder based on content type
        String subfolder = contentType.startsWith("image/") || contentType.startsWith("video/") ? "media" : "file";

        // Sanitize filename to avoid signature issues with special characters
        String sanitizedFileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");

        String key = folderName + "/" + subfolder + "/" + java.util.UUID.randomUUID() + "_" + sanitizedFileName;

        return ResponseEntity.ok(storageService.generatePresignedUrl(key, contentType));
    }
}
