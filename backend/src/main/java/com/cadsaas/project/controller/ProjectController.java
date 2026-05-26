package com.cadsaas.project.controller;

import com.cadsaas.common.response.ApiResponse;
import com.cadsaas.project.domain.dto.ProjectResponse;
import com.cadsaas.project.service.ProjectService;
import com.cadsaas.user.domain.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project management")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "List user projects with optional filters")
    public ResponseEntity<ApiResponse<Page<ProjectResponse>>> getProjects(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String inputType,
            @RequestParam(required = false) String search) {

        Page<ProjectResponse> projects = projectService
            .getUserProjects(user, status, inputType, search, PageRequest.of(page, size))
            .map(ProjectResponse::from);

        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
            ApiResponse.success(ProjectResponse.from(projectService.getProject(user, id)))
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a project")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        projectService.deleteProject(user, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Project deleted"));
    }

    @GetMapping("/{projectId}/files/{fileId}/download")
    @Operation(summary = "Download a generated file")
    public ResponseEntity<Resource> downloadFile(
            @AuthenticationPrincipal User user,
            @PathVariable UUID projectId,
            @PathVariable UUID fileId) {
        var fileResource = projectService.downloadFile(user, projectId, fileId);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + fileResource.filename() + "\"")
            .body(fileResource.resource());
    }

    @GetMapping("/{projectId}/files/stl/download")
    @Operation(summary = "Download STL file for 3D preview")
    public ResponseEntity<Resource> downloadStl(
            @AuthenticationPrincipal User user,
            @PathVariable UUID projectId) {
        var fileResource = projectService.downloadStlFile(user, projectId);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + fileResource.filename() + "\"")
            .body(fileResource.resource());
    }
}
