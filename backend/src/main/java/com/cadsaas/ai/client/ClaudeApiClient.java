package com.cadsaas.ai.client;

import com.cadsaas.common.exception.BusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClaudeApiClient {

    private final WebClient claudeWebClient;
    private final ObjectMapper objectMapper;

    @Value("${application.claude.retry-attempts}")
    private int retryAttempts;

    @Value("${application.claude.timeout-seconds}")
    private int timeoutSeconds;

    public String sendMessage(String model, String systemPrompt, String userMessage, int maxTokens) {
        Map<String, Object> requestBody = buildRequest(model, systemPrompt, userMessage, maxTokens);

        return claudeWebClient.post()
            .uri("/messages")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .onStatus(HttpStatusCode::isError, response ->
                response.bodyToMono(String.class).map(body -> {
                    log.error("Claude API error: {}", body);
                    return new BusinessException("Claude API error: " + body);
                })
            )
            .bodyToMono(Map.class)
            .timeout(Duration.ofSeconds(timeoutSeconds))
            .retryWhen(Retry.backoff(retryAttempts, Duration.ofSeconds(2))
                .filter(ex -> !(ex instanceof BusinessException)))
            .map(this::extractTextContent)
            .block();
    }

    public String sendVisionMessage(String model, String systemPrompt, String userMessage,
                                    String base64Image, String mimeType, int maxTokens) {
        List<Map<String, Object>> content = List.of(
            Map.of("type", "image", "source", Map.of(
                "type", "base64",
                "media_type", mimeType,
                "data", base64Image
            )),
            Map.of("type", "text", "text", userMessage)
        );

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "max_tokens", maxTokens,
            "system", systemPrompt,
            "messages", List.of(Map.of("role", "user", "content", content))
        );

        return claudeWebClient.post()
            .uri("/messages")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map.class)
            .timeout(Duration.ofSeconds(timeoutSeconds))
            .retryWhen(Retry.backoff(retryAttempts, Duration.ofSeconds(2)))
            .map(this::extractTextContent)
            .block();
    }

    public Flux<String> streamMessage(String model, String systemPrompt, String userMessage, int maxTokens) {
        Map<String, Object> requestBody = buildRequest(model, systemPrompt, userMessage, maxTokens);
        ((Map<String, Object>) requestBody).put("stream", true);

        return claudeWebClient.post()
            .uri("/messages")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.TEXT_EVENT_STREAM)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToFlux(String.class)
            .filter(line -> line.startsWith("data:"))
            .map(line -> line.substring(5).trim())
            .filter(data -> !data.equals("[DONE]"))
            .mapNotNull(this::extractStreamDelta);
    }

    private Map<String, Object> buildRequest(String model, String systemPrompt, String userMessage, int maxTokens) {
        return Map.of(
            "model", model,
            "max_tokens", maxTokens,
            "system", systemPrompt,
            "messages", List.of(Map.of("role", "user", "content", userMessage))
        );
    }

    @SuppressWarnings("unchecked")
    private String extractTextContent(Map<?, ?> response) {
        try {
            List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
            if (content != null && !content.isEmpty()) {
                return (String) content.get(0).get("text");
            }
            throw new BusinessException("Empty response from Claude API");
        } catch (ClassCastException e) {
            throw new BusinessException("Unexpected Claude API response format");
        }
    }

    @SuppressWarnings("unchecked")
    private String extractStreamDelta(String data) {
        try {
            Map<String, Object> event = objectMapper.readValue(data, Map.class);
            String type = (String) event.get("type");
            if ("content_block_delta".equals(type)) {
                Map<String, Object> delta = (Map<String, Object>) event.get("delta");
                if (delta != null) {
                    return (String) delta.get("text");
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
