package com.taskforge.aiagent.application;

import com.taskforge.aiagent.infrastructure.AIAgentExecutionEntity;
import com.taskforge.aiagent.infrastructure.AIAgentExecutionRepository;
import com.taskforge.aiagent.infrastructure.AITaskQueueEntity;
import com.taskforge.aiagent.infrastructure.AITaskQueueRepository;
import com.taskforge.aiagent.orchestration.AIPipeline;
import com.taskforge.audit.application.AuditService;
import com.taskforge.common.exception.ApiException;
import com.taskforge.permission.domain.OrgPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * The human side of the AI pipeline: approve an agent's delivered work
 * (which enqueues the next agent in AIPipeline, if any) or request changes
 * (which re-queues the SAME agent with the reviewer's note folded into a
 * new instruction, so the agent's next run is directly informed by what
 * wasn't satisfactory — not a blind retry).
 */
@Service
public class AIApprovalService {

    private final AIAgentExecutionRepository executionRepository;
    private final AITaskQueueRepository queueRepository;
    private final AuditService auditService;

    public AIApprovalService(AIAgentExecutionRepository executionRepository, AITaskQueueRepository queueRepository,
                              AuditService auditService) {
        this.executionRepository = executionRepository;
        this.queueRepository = queueRepository;
        this.auditService = auditService;
    }

    @Transactional
    public AIAgentExecutionEntity approve(OrgPrincipal actingAs, UUID executionId, String note) {
        AIAgentExecutionEntity execution = getPendingReview(executionId);
        execution.approve(actingAs.organizationMemberId(), note);
        executionRepository.save(execution);

        auditService.record(actingAs.organizationId(), actingAs.organizationMemberId(), "AI_EXECUTION_APPROVED",
                "AI_AGENT_EXECUTION", executionId, "{\"agentType\":\"" + execution.getAgentType() + "\"}");

        Optional<com.taskforge.aiagent.domain.AgentType> next = AIPipeline.next(execution.getAgentType());
        next.ifPresent(nextAgent -> {
            AITaskQueueEntity task = AITaskQueueEntity.queued(
                    execution.getIssueId(), nextAgent, "PIPELINE_ADVANCE", null);
            queueRepository.save(task);
        });

        return execution;
    }

    @Transactional
    public AIAgentExecutionEntity requestChanges(OrgPrincipal actingAs, UUID executionId, String note) {
        if (note == null || note.isBlank()) {
            throw ApiException.badRequest("A note explaining what needs to change is required");
        }
        AIAgentExecutionEntity execution = getPendingReview(executionId);
        execution.requestChanges(actingAs.organizationMemberId(), note);
        executionRepository.save(execution);

        auditService.record(actingAs.organizationId(), actingAs.organizationMemberId(), "AI_EXECUTION_CHANGES_REQUESTED",
                "AI_AGENT_EXECUTION", executionId, "{\"agentType\":\"" + execution.getAgentType() + "\"}");

        // Re-queue the SAME agent with the reviewer's note as fresh instructions —
        // a directed retry, not a blind one.
        String revisedInstructions = (execution.getInstructions() == null ? "" : execution.getInstructions() + "\n\n")
                + "Reviewer feedback on your previous attempt: " + note;
        AITaskQueueEntity task = AITaskQueueEntity.queued(
                execution.getIssueId(), execution.getAgentType(), "REVISION_REQUESTED", revisedInstructions);
        queueRepository.save(task);

        return execution;
    }

    private AIAgentExecutionEntity getPendingReview(UUID executionId) {
        AIAgentExecutionEntity execution = executionRepository.findById(executionId)
                .orElseThrow(() -> ApiException.notFound("Execution not found"));
        if (!"PENDING_REVIEW".equals(execution.getApprovalStatus())) {
            throw ApiException.badRequest("This execution is not awaiting review (status: " + execution.getApprovalStatus() + ")");
        }
        return execution;
    }
}
