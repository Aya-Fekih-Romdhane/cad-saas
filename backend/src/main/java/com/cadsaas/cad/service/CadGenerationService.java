package com.cadsaas.cad.service;

import com.cadsaas.common.exception.BusinessException;
import com.cadsaas.project.domain.entity.GeneratedFile;
import com.cadsaas.project.domain.entity.Project;
import com.cadsaas.project.domain.repository.ProjectRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CadGenerationService {

    private final ProjectRepository projectRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${application.cad-service.url}")
    private String cadServiceUrl;

    @Value("${application.cad-service.timeout-seconds}")
    private int timeoutSeconds;

    @Transactional
    public void generateModel(UUID projectId, JsonNode cadJson) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new BusinessException("Project not found"));

        log.info("Calling CAD service for project {}", projectId);

        WebClient cadClient = webClientBuilder.baseUrl(cadServiceUrl).build();

        Map<String, Object> request = Map.of(
            "project_id", projectId.toString(),
            "cad_parameters", cadJson,
            "export_formats", List.of("STEP", "STL", "OBJ")
        );

        try {
            Map<?, ?> response = cadClient.post()
                .uri("/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .block();

            if (response != null && response.containsKey("files")) {
                processGeneratedFiles(project, response);
                projectRepository.save(project);
            }
        } catch (Exception e) {
            log.error("CAD service call failed for project {}", projectId, e);
            throw new BusinessException("CAD generation failed: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void processGeneratedFiles(Project project, Map<?, ?> response) {
        List<Map<String, Object>> files = (List<Map<String, Object>>) response.get("files");
        for (Map<String, Object> fileInfo : files) {
            GeneratedFile gf = GeneratedFile.builder()
                .project(project)
                .fileName((String) fileInfo.get("name"))
                .filePath((String) fileInfo.get("path"))
                .fileType(GeneratedFile.FileType.valueOf((String) fileInfo.get("type")))
                .fileSize(((Number) fileInfo.getOrDefault("size", 0L)).longValue())
                .mimeType((String) fileInfo.get("mime_type"))
                .isPrimary(Boolean.TRUE.equals(fileInfo.get("is_primary")))
                .build();
            project.getFiles().add(gf);
        }
    }
}
