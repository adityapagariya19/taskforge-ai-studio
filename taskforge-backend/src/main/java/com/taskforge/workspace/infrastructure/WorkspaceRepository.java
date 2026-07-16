package com.taskforge.workspace.infrastructure;

import com.taskforge.workspace.domain.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
    boolean existsBySlug(String slug);
    Optional<Workspace> findBySlug(String slug);
    java.util.List<Workspace> findByOrganizationId(UUID organizationId);
}
