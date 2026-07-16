package com.taskforge.project.infrastructure;

import com.taskforge.project.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    List<Project> findByWorkspaceId(UUID workspaceId);
    boolean existsByWorkspaceIdAndKey(UUID workspaceId, String key);
    Optional<Project> findByWorkspaceIdAndKey(UUID workspaceId, String key);
}
