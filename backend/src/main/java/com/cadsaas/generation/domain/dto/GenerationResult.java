package com.cadsaas.generation.domain.dto;

public record GenerationResult(
    String projectId,
    String status,
    String message
) {}
