package com.taskforge.activity.infrastructure;

import com.taskforge.activity.domain.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findByIssueIdOrderByCreatedAtAsc(UUID issueId);
    List<ActivityLog> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
