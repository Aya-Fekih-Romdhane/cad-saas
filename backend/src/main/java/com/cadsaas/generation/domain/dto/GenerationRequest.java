package com.cadsaas.generation.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerationRequest(
    String name,
    @NotBlank @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    String description
) {}
