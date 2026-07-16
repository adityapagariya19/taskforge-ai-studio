package com.taskforge.activity.application;

import com.taskforge.activity.domain.ActivityLog;
import com.taskforge.activity.infrastructure.ActivityLogRepository;
import com.taskforge.aiagent.domain.AgentType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ActivityLogService {

    private final ActivityLogRepository repository;

    public ActivityLogService(ActivityLogRepository repository) {
        this.repository = repository;
    }

    public void logHuman(UUID projectId, UUID issueId, UUID actorId, String actionType,
                          String fieldName, String oldValue, String newValue) {
        ActivityLog log = new ActivityLog();
        log.setProjectId(projectId);
        log.setIssueId(issueId);
        log.setActorId(actorId);
        log.setActionType(actionType);
        log.setFieldName(fieldName);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        repository.save(log);
    }

    public void logAi(UUID projectId, UUID issueId, AgentType agentType, String actionType, String newValue) {
        ActivityLog log = new ActivityLog();
        log.setProjectId(projectId);
        log.setIssueId(issueId);
        log.setActorIsAi(true);
        log.setActorAiType(agentType);
        log.setActionType(actionType);
        log.setNewValue(newValue);
        repository.save(log);
    }

    public List<ActivityLog> listByIssue(UUID issueId) {
        return repository.findByIssueIdOrderByCreatedAtAsc(issueId);
    }
}
