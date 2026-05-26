package com.cadsaas.project.domain.repository;

import com.cadsaas.common.enums.ProjectStatus;
import com.cadsaas.project.domain.entity.Project;
import com.cadsaas.user.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository
        extends JpaRepository<Project, UUID>, JpaSpecificationExecutor<Project> {

    Page<Project> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Optional<Project> findByIdAndUser(UUID id, User user);

    long countByUser(User user);

    long countByUserAndStatus(User user, ProjectStatus status);
}
