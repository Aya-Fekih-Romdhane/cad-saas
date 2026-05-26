package com.cadsaas.project.service;

import com.cadsaas.common.exception.BusinessException;
import com.cadsaas.project.domain.entity.GeneratedFile;
import com.cadsaas.project.domain.entity.Project;
import com.cadsaas.project.domain.repository.ProjectRepository;
import com.cadsaas.project.domain.repository.ProjectSpecification;
import com.cadsaas.user.domain.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;

    public Page<Project> getUserProjects(User user, String status, String inputType,
                                          String search, Pageable pageable) {
        return projectRepository.findAll(
                ProjectSpecification.build(user, status, inputType, search),
                pageable
        );
    }

    public Project getProject(User user, UUID id) {
        return projectRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new BusinessException("Project not found"));
    }

    @Transactional
    public void deleteProject(User user, UUID id) {
        Project project = getProject(user, id);
        projectRepository.delete(project);
    }

    public record FileResource(String filename, Resource resource) {}

    public FileResource downloadFile(User user, UUID projectId, UUID fileId) {
        Project project = getProject(user, projectId);
        GeneratedFile file = project.getFiles().stream()
            .filter(f -> f.getId().equals(fileId))
            .findFirst()
            .orElseThrow(() -> new BusinessException("File not found"));

        Path filePath = Paths.get(file.getFilePath());
        return new FileResource(file.getFileName(), new FileSystemResource(filePath));
    }

    public FileResource downloadStlFile(User user, UUID projectId) {
        Project project = getProject(user, projectId);
        return project.getFiles().stream()
            .filter(f -> f.getFileType() == GeneratedFile.FileType.STL)
            .findFirst()
            .map(f -> new FileResource(f.getFileName(), new FileSystemResource(Paths.get(f.getFilePath()))))
            .orElseThrow(() -> new BusinessException("STL file not available yet"));
    }

}
