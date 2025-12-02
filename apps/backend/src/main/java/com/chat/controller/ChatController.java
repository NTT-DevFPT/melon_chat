package com.chat.controller;

import com.chat.dto.chat.AddReactionRequest;
import com.chat.dto.chat.ChatRoomResponse;
import com.chat.dto.chat.CreateGroupRequest;
import com.chat.dto.chat.MessageReactionResponse;
import com.chat.dto.chat.SendMessageRequest;
import com.chat.model.ChatRoom;
import com.chat.model.Message;
import com.chat.model.enums.MessageType;
import com.chat.security.UserPrincipal;
import com.chat.service.ChatRoomService;
import com.chat.service.MessageReactionService;
import com.chat.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    @Autowired
    private ChatRoomService chatRoomService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private MessageReactionService reactionService;

    @PostMapping("/direct/{userId}")
    public ResponseEntity<ChatRoomResponse> createDirectChat(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID userId) {
        ChatRoom room = chatRoomService.createDirectRoom(currentUser.getId(), userId);
        ChatRoomResponse response = chatRoomService.mapRoomToResponse(room);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/group")
    public ResponseEntity<ChatRoomResponse> createGroupChat(@AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateGroupRequest request) {
        ChatRoom room = chatRoomService.createGroupRoom(request.getName(), currentUser.getId(), request.getMemberIds());
        ChatRoomResponse response = chatRoomService.mapRoomToResponse(room);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ChatRoomResponse>> getUserRooms(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<ChatRoomResponse> rooms = chatRoomService.getUserRoomResponses(currentUser.getId());
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<ChatRoom> getRoomDetails(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID roomId) {
        // Check membership implicit in service or here?
        // Service getRoomById doesn't check membership, but we should probably verify
        // For now, let's rely on frontend to only request rooms user is in,
        // or add a check:
        if (!chatRoomService.isRoomMember(roomId, currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }

        ChatRoom room = chatRoomService.getRoomById(roomId);
        return ResponseEntity.ok(room);
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getRoomMessages(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<Message> messages = messageService.getRoomMessages(roomId, currentUser.getId(), page, size);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/{roomId}/messages/recent")
    public ResponseEntity<List<Message>> getRecentMessages(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID roomId,
            @RequestParam String since) {
        LocalDateTime sinceTime = LocalDateTime.parse(since); // Expect ISO format
        List<Message> messages = messageService.getRecentMessages(roomId, currentUser.getId(), sinceTime);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{roomId}/messages")
    public ResponseEntity<Message> sendMessage(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID roomId,
            @Valid @RequestBody SendMessageRequest request) {
        Message message;
        if (request.getType() == MessageType.TEXT) {
            message = messageService.sendTextMessage(roomId, currentUser.getId(), request.getContent());
        } else {
            message = messageService.sendFileMessage(
                    roomId,
                    currentUser.getId(),
                    request.getAttachmentUrl(),
                    request.getAttachmentName(),
                    request.getAttachmentSize(),
                    request.getType());
        }
        return ResponseEntity.ok(message);
    }

    @PostMapping("/{roomId}/read")
    public ResponseEntity<?> markAsRead(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID roomId) {
        messageService.markAsRead(roomId, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID messageId) {
        messageService.deleteMessage(messageId, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<Message> editMessage(@AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID messageId,
            @Valid @RequestBody com.chat.dto.chat.EditMessageRequest request) {
        Message message = messageService.editMessage(messageId, currentUser.getId(), request.getContent());
        return ResponseEntity.ok(message);
    }

    // Message Reaction Endpoints

    @PostMapping("/messages/{messageId}/reactions")
    public ResponseEntity<MessageReactionResponse> addReaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID messageId,
            @Valid @RequestBody AddReactionRequest request) {
        MessageReactionResponse reaction = reactionService.addReaction(
                messageId, 
                currentUser.getId(), 
                request.getEmoji()
        );
        return ResponseEntity.ok(reaction);
    }

    @DeleteMapping("/messages/{messageId}/reactions/{emoji}")
    public ResponseEntity<?> removeReaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable UUID messageId,
            @PathVariable String emoji) {
        reactionService.removeReaction(messageId, currentUser.getId(), emoji);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/messages/{messageId}/reactions")
    public ResponseEntity<List<MessageReactionResponse>> getMessageReactions(
            @PathVariable UUID messageId) {
        List<MessageReactionResponse> reactions = reactionService.getMessageReactions(messageId);
        return ResponseEntity.ok(reactions);
    }

    @GetMapping("/messages/{messageId}/reactions/counts")
    public ResponseEntity<Map<String, Long>> getReactionCounts(
            @PathVariable UUID messageId) {
        Map<String, Long> counts = reactionService.getReactionCounts(messageId);
        return ResponseEntity.ok(counts);
    }
}
