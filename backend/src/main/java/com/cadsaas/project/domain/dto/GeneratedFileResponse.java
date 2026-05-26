package com.cadsaas.project.domain.dto;

import com.cadsaas.project.domain.entity.GeneratedFile;

import java.time.LocalDateTime;
import java.util.UUID;

public record GeneratedFileResponse(
    UUID id,
    String fileName,
    String fileType,
    Long fileSize,
    String mimeType,
    boolean isPrimary,
    LocalDateTime createdAt
) {
    public static GeneratedFileResponse from(GeneratedFile f) {
        return new GeneratedFileResponse(
            f.getId(),
            f.getFileName(),
            f.getFileType().name(),
            f.getFileSize(),
            f.getMimeType(),
            f.isPrimary(),
            f.getCreatedAt()
        );
    }
}
