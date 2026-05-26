package com.cadsaas.generation.controller;

import com.cadsaas.common.response.ApiResponse;
import com.cadsaas.generation.domain.dto.GenerationRequest;
import com.cadsaas.generation.domain.dto.GenerationResult;
import com.cadsaas.generation.service.GenerationService;
import com.cadsaas.user.domain.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/generation")
@RequiredArgsConstructor
@Tag(name = "Generation", description = "CAD generation endpoints")
public class GenerationController {

    private final GenerationService generationService;

    @PostMapping("/text")
    @Operation(summary = "Generate CAD from text description")
    public ResponseEntity<ApiResponse<GenerationResult>> generateFromText(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody GenerationRequest request) {
        return ResponseEntity.accepted()
            .body(ApiResponse.success(
                generationService.initiateTextGeneration(user, request),
                "Generation started"
            ));
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Generate CAD from uploaded image")
    public ResponseEntity<ApiResponse<GenerationResult>> generateFromImage(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "context", required = false) String additionalContext) {
        return ResponseEntity.accepted()
            .body(ApiResponse.success(
                generationService.initiateImageGeneration(user, file, additionalContext),
                "Image analysis and generation started"
            ));
    }
}
