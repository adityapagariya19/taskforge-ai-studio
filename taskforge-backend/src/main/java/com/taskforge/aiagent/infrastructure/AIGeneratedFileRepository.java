package com.taskforge.aiagent.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AIGeneratedFileRepository extends JpaRepository<AIGeneratedFile, UUID> {
    List<AIGeneratedFile> findByExecutionId(UUID executionId);
}
