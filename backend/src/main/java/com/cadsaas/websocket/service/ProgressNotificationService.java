package com.cadsaas.websocket.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendProgress(String projectId, int percentage, String message) {
        Map<String, Object> payload = Map.of(
            "projectId", projectId,
            "percentage", percentage,
            "message", message,
            "status", "PROCESSING",
            "timestamp", LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/generation/" + projectId, payload);
        log.debug("Progress sent for project {}: {}% - {}", projectId, percentage, message);
    }

    public void sendError(String projectId, String errorMessage) {
        Map<String, Object> payload = Map.of(
            "projectId", projectId,
            "percentage", 0,
            "message", errorMessage,
            "status", "FAILED",
            "timestamp", LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/generation/" + projectId, payload);
    }

    public void sendCompleted(String projectId, Object result) {
        Map<String, Object> payload = Map.of(
            "projectId", projectId,
            "percentage", 100,
            "message", "Generation completed successfully",
            "status", "COMPLETED",
            "result", result,
            "timestamp", LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/generation/" + projectId, payload);
    }
}
