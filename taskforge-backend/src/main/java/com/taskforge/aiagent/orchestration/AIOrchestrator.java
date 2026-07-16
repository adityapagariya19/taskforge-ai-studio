package com.taskforge.aiagent.orchestration;

import com.taskforge.aiagent.domain.AgentType;
import com.taskforge.aiagent.infrastructure.AITaskQueueEntity;
import com.taskforge.aiagent.infrastructure.AITaskQueueRepository;
import com.taskforge.aiagent.orchestration.events.IssueCreatedEvent;
import com.taskforge.aiagent.orchestration.events.IssueTransitionedEvent;
import com.taskforge.issue.application.IssueService;
import com.taskforge.issue.domain.Issue;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Decides which AI agent(s) should react to a domain event. This class makes
 * no LLM calls itself — it only enqueues work; AITaskQueueWorker does the
 * actual execution. Keeping "who should act" separate from "how they act"
 * is what lets you swap the queue's transport (DB polling -> Kafka, etc.)
 * later without touching these rules.
 */
@Component
public class AIOrchestrator {

    private final AITaskQueueRepository queueRepository;
    private final IssueService issueService;

    public AIOrchestrator(AITaskQueueRepository queueRepository, IssueService issueService) {
        this.queueRepository = queueRepository;
        this.issueService = issueService;
    }

    @EventListener
    public void onIssueCreated(IssueCreatedEvent event) {
        List<AgentType> toTrigger = switch (event.issueType()) {
            case "EPIC" -> List.of(AgentType.ARCHITECT_AI, AgentType.PROJECT_MANAGER_AI);
            case "STORY", "TASK", "BUG" -> List.of(AgentType.PROJECT_MANAGER_AI);
            default -> List.of();
        };
        toTrigger.forEach(type -> enqueue(event.issueId(), type, "ISSUE_CREATED"));
    }

    @EventListener
    public void onIssueTransitioned(IssueTransitionedEvent event) {
        Issue issue = issueService.getById(event.issueId());
        String statusName = event.newStatusName();

        if ("In Progress".equals(statusName) && issue.isAssigneeIsAi() && issue.getAssigneeAiType() != null) {
            // The human assigned this task to an AI teammate — it now does the work on its own.
            enqueue(issue.getId(), issue.getAssigneeAiType(), "ISSUE_MOVED_TO_IN_PROGRESS");
        } else if ("In Review".equals(statusName)) {
            enqueue(issue.getId(), AgentType.TESTER_AI, "ISSUE_MOVED_TO_IN_REVIEW");
            enqueue(issue.getId(), AgentType.REVIEWER_AI, "ISSUE_MOVED_TO_IN_REVIEW");
        } else if ("Done".equals(statusName)) {
            enqueue(issue.getId(), AgentType.DOCUMENTATION_AI, "ISSUE_MOVED_TO_DONE");
        }
    }

    private void enqueue(UUID issueId, AgentType agentType, String triggerEvent) {
        queueRepository.save(AITaskQueueEntity.queued(issueId, agentType, triggerEvent));
    }
}
