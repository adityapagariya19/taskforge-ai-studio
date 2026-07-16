package com.taskforge.aiagent.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AITaskQueueRepository extends JpaRepository<AITaskQueueEntity, UUID> {
    List<AITaskQueueEntity> findTop10ByStatusOrderByEnqueuedAtAsc(String status);
}
