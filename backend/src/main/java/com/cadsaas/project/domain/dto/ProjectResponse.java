package com.cadsaas.project.domain.dto;

import com.cadsaas.common.enums.ProjectStatus;
import com.cadsaas.project.domain.entity.Project;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ProjectResponse(
    UUID id,
    String name,
    String description,
    String prompt,
    String inputType,
    ProjectStatus status,
    String errorMessage,
    String thumbnailPath,
    List<GeneratedFileResponse> files,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static ProjectResponse from(Project p) {
        return new ProjectResponse(
            p.getId(),
            p.getName(),
            p.getDescription(),
            p.getPrompt(),
            p.getInputType().name(),
            p.getStatus(),
            p.getErrorMessage(),
            p.getThumbnailPath(),
            p.getFiles().stream().map(GeneratedFileResponse::from).toList(),
            p.getCreatedAt(),
            p.getUpdatedAt()
        );
    }
}
