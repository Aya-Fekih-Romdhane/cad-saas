package com.cadsaas.ai.service;

import com.cadsaas.ai.client.ClaudeApiClient;
import com.cadsaas.ai.prompt.CadPromptBuilder;
import com.cadsaas.common.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaudeAIService {

    private final ClaudeApiClient claudeApiClient;
    private final CadPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    @Value("${application.claude.api-key:}")
    private String apiKey;

    @Value("${application.claude.model}")
    private String model;

    @Value("${application.claude.vision-model}")
    private String visionModel;

    @Value("${application.claude.max-tokens}")
    private int maxTokens;

    /** Analyze text description → structured CAD parameters. */
    public JsonNode analyzeTextDescription(String userDescription) {
        if (isApiKeyMissing()) {
            log.warn("CLAUDE_API_KEY not set — using demo mode");
            return buildMockCadJson(userDescription, null);
        }
        try {
            String systemPrompt = promptBuilder.buildMechanicalDesignSystemPrompt();
            String userPrompt   = promptBuilder.buildTextAnalysisPrompt(userDescription);
            log.info("Analyzing CAD description via Claude: {}", userDescription.substring(0, Math.min(100, userDescription.length())));
            String response = claudeApiClient.sendMessage(model, systemPrompt, userPrompt, maxTokens);
            return parseJsonFromResponse(response);
        } catch (Exception e) {
            if (isBillingOrAuthError(e)) {
                log.warn("Claude API unavailable ({}), falling back to demo mode", extractErrorType(e));
                return buildMockCadJson(userDescription, null);
            }
            throw e;
        }
    }

    /** Analyze image → CAD geometry. */
    public JsonNode analyzeImage(byte[] imageBytes, String mimeType, String additionalContext) {
        if (isApiKeyMissing()) {
            log.warn("CLAUDE_API_KEY not set — using demo mode for image");
            return buildMockCadJson(additionalContext != null ? additionalContext : "part from image", "image");
        }
        try {
            String base64Image  = Base64.getEncoder().encodeToString(imageBytes);
            String systemPrompt = promptBuilder.buildImageAnalysisSystemPrompt();
            String userPrompt   = promptBuilder.buildImageAnalysisPrompt(additionalContext);
            log.info("Analyzing CAD image via Claude, size: {} bytes", imageBytes.length);
            String response = claudeApiClient.sendVisionMessage(
                visionModel, systemPrompt, userPrompt, base64Image, mimeType, maxTokens
            );
            return parseJsonFromResponse(response);
        } catch (Exception e) {
            if (isBillingOrAuthError(e)) {
                log.warn("Claude API unavailable ({}), falling back to demo mode", extractErrorType(e));
                return buildMockCadJson(additionalContext != null ? additionalContext : "part from image", "image");
            }
            throw e;
        }
    }

    /** Stream AI analysis for real-time feedback. */
    public Flux<String> streamAnalysis(String userDescription) {
        if (isApiKeyMissing()) {
            return Flux.just("Demo mode: generating mock CAD parameters...");
        }
        String systemPrompt = promptBuilder.buildMechanicalDesignSystemPrompt();
        String userPrompt   = promptBuilder.buildTextAnalysisPrompt(userDescription);
        return claudeApiClient.streamMessage(model, systemPrompt, userPrompt, maxTokens);
    }

    /** Refine CAD parameters based on user feedback. */
    public JsonNode refineCadParameters(JsonNode currentParams, String refinementRequest) {
        if (isApiKeyMissing()) {
            return buildMockCadJson(refinementRequest, null);
        }
        try {
            String systemPrompt = promptBuilder.buildRefinementSystemPrompt();
            String userPrompt   = promptBuilder.buildRefinementPrompt(currentParams.toString(), refinementRequest);
            String response     = claudeApiClient.sendMessage(model, systemPrompt, userPrompt, maxTokens);
            return parseJsonFromResponse(response);
        } catch (Exception e) {
            if (isBillingOrAuthError(e)) {
                return buildMockCadJson(refinementRequest, null);
            }
            throw e;
        }
    }

    // ─── private helpers ───────────────────────────────────────────────────────

    private boolean isApiKeyMissing() {
        return apiKey == null || apiKey.isBlank();
    }

    /** Returns true for billing, auth, or quota errors that should trigger demo fallback. */
    private boolean isBillingOrAuthError(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        return msg.contains("credit balance")
            || msg.contains("too low")
            || msg.contains("authentication_error")
            || msg.contains("invalid x-api-key")
            || msg.contains("permission_error")
            || msg.contains("overloaded");
    }

    private String extractErrorType(Exception e) {
        if (e.getMessage() == null) return "unknown";
        if (e.getMessage().contains("credit")) return "insufficient credits";
        if (e.getMessage().contains("authentication")) return "invalid API key";
        return "API error";
    }

    /**
     * Demo / mock mode: build a realistic CAD JSON from keywords in the description.
     * Supports: bolt, screw, shaft, flange, plate, bracket, gear, cylinder, box, cone, sphere.
     */
    private JsonNode buildMockCadJson(String description, String hint) {
        String lower = description != null ? description.toLowerCase() : "";

        // Extract first numeric dimension found, e.g. "50mm" → 50
        double dim = extractFirstDimension(description, 50.0);

        String shape, name, material;
        String featuresJson;

        if (lower.contains("bolt") || lower.contains("screw") || lower.contains("fastener")) {
            shape    = "cylinder";
            name     = "Hex Bolt M" + (int) dim;
            material = "Carbon Steel";
            featuresJson = """
                [
                  {"type":"thread","count":1,"diameter":%s,"depth":%s,"radius":null,"pattern":null,"position":null},
                  {"type":"chamfer","count":1,"diameter":null,"depth":2.0,"radius":null,"pattern":null,"position":null}
                ]""".formatted(dim, dim * 2.5);
        } else if (lower.contains("flange")) {
            shape    = "flange";
            name     = "Circular Flange";
            material = "Stainless Steel";
            double holeD = Math.max(8, dim / 15);
            int holeCnt  = dim > 100 ? 8 : 6;
            featuresJson = """
                [
                  {"type":"hole","count":%d,"diameter":%s,"depth":null,"radius":null,"pattern":"circular","position":null},
                  {"type":"hole","count":1,"diameter":%s,"depth":null,"radius":null,"pattern":null,"position":null}
                ]""".formatted(holeCnt, holeD, dim * 0.4);
        } else if (lower.contains("shaft") || lower.contains("axle")) {
            shape    = "cylinder";
            name     = "Rotating Shaft";
            material = "Alloy Steel";
            featuresJson = """
                [
                  {"type":"slot","count":1,"diameter":null,"depth":%s,"radius":null,"pattern":null,"position":null},
                  {"type":"chamfer","count":2,"diameter":null,"depth":2.0,"radius":null,"pattern":null,"position":null}
                ]""".formatted(dim * 0.13);
        } else if (lower.contains("bracket") || lower.contains("mount")) {
            shape    = "bracket";
            name     = "Mounting Bracket";
            material = "Aluminium 6061";
            featuresJson = """
                [
                  {"type":"hole","count":4,"diameter":8.5,"depth":null,"radius":null,"pattern":"linear","position":null},
                  {"type":"fillet","count":4,"diameter":null,"depth":null,"radius":5.0,"pattern":null,"position":null}
                ]""";
        } else if (lower.contains("gear") || lower.contains("sprocket")) {
            shape    = "gear";
            name     = "Spur Gear";
            material = "Carbon Steel";
            featuresJson = """
                [
                  {"type":"hole","count":1,"diameter":%s,"depth":null,"radius":null,"pattern":null,"position":null},
                  {"type":"slot","count":1,"diameter":null,"depth":%s,"radius":null,"pattern":null,"position":null}
                ]""".formatted(dim * 0.3, dim * 0.06);
        } else if (lower.contains("plate") || lower.contains("panel")) {
            shape    = "plate";
            name     = "Rectangular Plate";
            material = "Mild Steel";
            featuresJson = """
                [
                  {"type":"hole","count":4,"diameter":10.5,"depth":null,"radius":null,"pattern":"linear","position":null},
                  {"type":"chamfer","count":4,"diameter":null,"depth":3.0,"radius":null,"pattern":null,"position":null}
                ]""";
        } else if (lower.contains("sphere") || lower.contains("ball")) {
            shape    = "sphere";
            name     = "Sphere";
            material = "Steel";
            featuresJson = "[]";
        } else if (lower.contains("cone") || lower.contains("tapered")) {
            shape    = "cone";
            name     = "Tapered Cone";
            material = "Aluminium";
            featuresJson = "[]";
        } else {
            // Default: generic cylinder
            shape    = "cylinder";
            name     = "Cylindrical Part";
            material = "Mild Steel";
            featuresJson = """
                [
                  {"type":"hole","count":1,"diameter":%s,"depth":null,"radius":null,"pattern":null,"position":null}
                ]""".formatted(dim * 0.3);
        }

        double diameter  = lower.contains("plate") || lower.contains("box") ? 0 : dim;
        double length    = dim * (lower.contains("shaft") ? 6 : lower.contains("bolt") ? 3.5 : 1);
        double width     = lower.contains("plate") || lower.contains("bracket") ? dim * 1.5 : dim;
        double height    = lower.contains("plate") ? dim * 0.1 : dim;
        double thickness = lower.contains("flange") ? dim * 0.15 : (lower.contains("plate") ? dim * 0.08 : 0);

        String json = """
            {
              "shape": "%s",
              "name": "%s",
              "description": "%s",
              "unit": "mm",
              "dimensions": {
                "length": %.1f,
                "width":  %.1f,
                "height": %.1f,
                "diameter": %.1f,
                "radius": %.1f,
                "thickness": %.1f
              },
              "features": %s,
              "material": {
                "name": "%s",
                "type": "metal",
                "density": 7850.0
              }
            }
            """.formatted(
                shape, name, description.replace("\"", "'"),
                length, width, height,
                diameter, diameter / 2.0, thickness,
                featuresJson,
                material
        );

        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            log.error("Failed to build mock CAD JSON", e);
            throw new BusinessException("Demo mode error: " + e.getMessage());
        }
    }

    private double extractFirstDimension(String text, double defaultValue) {
        if (text == null) return defaultValue;
        Pattern p = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:mm|cm|inch|in|m)?");
        Matcher m = p.matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1)); } catch (NumberFormatException ignored) {}
        }
        return defaultValue;
    }

    private double extractDimension(String text, String keywords, double defaultValue) {
        if (text == null) return defaultValue;
        Pattern p = Pattern.compile("(?:" + keywords + ")[^\\d]*(\\d+(?:\\.\\d+)?)", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(text);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1)); } catch (NumberFormatException ignored) {}
        }
        return defaultValue;
    }

    private JsonNode parseJsonFromResponse(String response) {
        try {
            String cleaned = response.trim();
            if (cleaned.contains("```json")) {
                int start = cleaned.indexOf("```json") + 7;
                int end   = cleaned.lastIndexOf("```");
                cleaned   = cleaned.substring(start, end).trim();
            } else if (cleaned.contains("```")) {
                int start = cleaned.indexOf("```") + 3;
                int end   = cleaned.lastIndexOf("```");
                cleaned   = cleaned.substring(start, end).trim();
            }
            return objectMapper.readTree(cleaned);
        } catch (Exception e) {
            log.error("Failed to parse JSON from AI response: {}", response, e);
            throw new BusinessException("AI response parsing failed: " + e.getMessage());
        }
    }
}
