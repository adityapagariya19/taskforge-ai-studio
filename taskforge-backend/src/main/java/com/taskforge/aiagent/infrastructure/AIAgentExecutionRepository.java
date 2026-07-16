package com.taskforge.aiagent.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AIAgentExecutionRepository extends JpaRepository<AIAgentExecutionEntity, UUID> {
    List<AIAgentExecutionEntity> findByIssueIdOrderByCreatedAtDesc(UUID issueId);
}
