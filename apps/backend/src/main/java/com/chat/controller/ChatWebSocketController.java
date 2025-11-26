package com.chat.controller;

import com.chat.dto.chat.SendMessageRequest;
import com.chat.model.Message;
import com.chat.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    @MessageMapping("/chat/{roomId}/sendMessage")
    public void sendMessage(@DestinationVariable UUID roomId,
            @Payload SendMessageRequest request,
            Principal principal) {

        // Extract user ID from Principal (username is usually the ID in our JWT setup,
        // or we need to look it up)
        // In JwtTokenProvider, we set subject as userId.toString()
        // So principal.getName() should be the userId
        UUID senderId = UUID.fromString(principal.getName());

        Message message;
        if (request.getType() == com.chat.model.enums.MessageType.TEXT) {
            message = messageService.sendTextMessage(roomId, senderId, request.getContent());
        } else {
            // For files, we usually upload via REST API first, then send WS message with
            // URL
            // Here we assume the request already has the URL if it's a file type
            message = messageService.sendFileMessage(
                    roomId,
                    senderId,
                    request.getAttachmentUrl(),
                    request.getAttachmentName(),
                    request.getAttachmentSize(),
                    request.getType());
        }

        // Send to public topic for the room
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }
}
