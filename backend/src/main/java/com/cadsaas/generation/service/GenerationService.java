package com.cadsaas.generation.service;

import com.cadsaas.ai.service.ClaudeAIService;
import com.cadsaas.cad.service.CadGenerationService;
import com.cadsaas.common.enums.ProjectStatus;
import com.cadsaas.common.exception.BusinessException;
import com.cadsaas.generation.domain.dto.GenerationRequest;
import com.cadsaas.generation.domain.dto.GenerationResult;
import com.cadsaas.project.domain.entity.Project;
import com.cadsaas.project.domain.repository.ProjectRepository;
import com.cadsaas.user.domain.entity.User;
import com.cadsaas.websocket.service.ProgressNotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationService {

    private final ProjectRepository projectRepository;
    private final ClaudeAIService claudeAIService;
    private final CadGenerationService cadGenerationService;
    private final ProgressNotificationService progressService;
    private final ObjectMapper objectMapper;

    @Transactional
    public GenerationResult initiateTextGeneration(User user, GenerationRequest request) {
        Project project = Project.builder()
            .user(user)
            .name(request.name() != null ? request.name() : "CAD Project " + System.currentTimeMillis())
            .prompt(request.description())
            .inputType(Project.InputType.TEXT)
            .status(ProjectStatus.PENDING)
            .build();
        project = projectRepository.save(project);

        processGenerationAsync(project.getId(), request.description(), null, null);

        return new GenerationResult(project.getId().toString(), ProjectStatus.PENDING.name(), null);
    }

    @Transactional
    public GenerationResult initiateImageGeneration(User user, MultipartFile file, String additionalContext) {
        try {
            Project project = Project.builder()
                .user(user)
                .name("CAD from Image " + System.currentTimeMillis())
                .prompt(additionalContext)
                .inputType(Project.InputType.IMAGE)
                .status(ProjectStatus.PENDING)
                .build();
            project = projectRepository.save(project);

            byte[] imageBytes = file.getBytes();
            String mimeType = file.getContentType();

            processGenerationAsync(project.getId(), null, imageBytes, mimeType);
            return new GenerationResult(project.getId().toString(), ProjectStatus.PENDING.name(), null);
        } catch (IOException e) {
            throw new BusinessException("Failed to read uploaded file: " + e.getMessage());
        }
    }

    @Async("generationTaskExecutor")
    protected CompletableFuture<Void> processGenerationAsync(
            UUID projectId, String description, byte[] imageBytes, String mimeType) {

        try {
            updateProjectStatus(projectId, ProjectStatus.ANALYZING, null);
            progressService.sendProgress(projectId.toString(), 10, "Analyzing with AI...");

            JsonNode cadJson;
            if (imageBytes != null) {
                cadJson = claudeAIService.analyzeImage(imageBytes, mimeType, description);
            } else {
                cadJson = claudeAIService.analyzeTextDescription(description);
            }

            updateProjectCadJson(projectId, cadJson.toString());
            progressService.sendProgress(projectId.toString(), 40, "CAD parameters extracted");

            updateProjectStatus(projectId, ProjectStatus.GENERATING, null);
            progressService.sendProgress(projectId.toString(), 50, "Generating 3D model...");

            cadGenerationService.generateModel(projectId, cadJson);
            progressService.sendProgress(projectId.toString(), 80, "Exporting files...");

            updateProjectStatus(projectId, ProjectStatus.COMPLETED, null);
            progressService.sendProgress(projectId.toString(), 100, "Generation complete!");

        } catch (Exception e) {
            log.error("Generation failed for project {}", projectId, e);
            updateProjectStatus(projectId, ProjectStatus.FAILED, e.getMessage());
            progressService.sendError(projectId.toString(), "Generation failed: " + e.getMessage());
        }

        return CompletableFuture.completedFuture(null);
    }

    @Transactional
    protected void updateProjectStatus(UUID projectId, ProjectStatus status, String errorMessage) {
        projectRepository.findById(projectId).ifPresent(project -> {
            project.setStatus(status);
            project.setErrorMessage(errorMessage);
            projectRepository.save(project);
        });
    }

    @Transactional
    protected void updateProjectCadJson(UUID projectId, String cadJson) {
        projectRepository.findById(projectId).ifPresent(project -> {
            project.setCadJson(cadJson);
            projectRepository.save(project);
        });
    }
}
