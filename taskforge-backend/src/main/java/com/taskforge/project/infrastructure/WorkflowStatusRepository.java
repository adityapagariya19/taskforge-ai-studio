package com.taskforge.project.infrastructure;

import com.taskforge.project.domain.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowStatusRepository extends JpaRepository<WorkflowStatus, UUID> {
    List<WorkflowStatus> findByProjectIdOrderByPosition(UUID projectId);
}
