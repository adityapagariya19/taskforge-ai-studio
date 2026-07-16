package com.taskforge.aiagent.infrastructure;

import com.taskforge.aiagent.domain.AgentType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_agent_executions")
@Getter
@Setter
@NoArgsConstructor
public class AIAgentExecutionEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "issue_id", nullable = false)
    private UUID issueId;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_type", nullable = false)
    private AgentType agentType;

    @Column(name = "trigger_event", nullable = false)
    private String triggerEvent;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "approval_status", nullable = false)
    private String approvalStatus = "NOT_REQUIRED";

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @Column(name = "output_summary", columnDefinition = "TEXT")
    private String outputSummary;

    @Column(name = "model_used")
    private String modelUsed;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public static AIAgentExecutionEntity start(UUID issueId, AgentType agentType, String triggerEvent) {
        return start(issueId, agentType, triggerEvent, null);
    }

    public static AIAgentExecutionEntity start(UUID issueId, AgentType agentType, String triggerEvent, String instructions) {
        AIAgentExecutionEntity e = new AIAgentExecutionEntity();
        e.issueId = issueId;
        e.agentType = agentType;
        e.triggerEvent = triggerEvent;
        e.instructions = instructions;
        e.status = "RUNNING";
        e.startedAt = Instant.now();
        return e;
    }

    /** requiresApproval=true for pipeline agents whose output should gate human review before the next agent runs. */
    public void complete(String outputSummary, String modelUsed, boolean requiresApproval) {
        this.status = "COMPLETED";
        this.outputSummary = outputSummary;
        this.modelUsed = modelUsed;
        this.completedAt = Instant.now();
        this.approvalStatus = requiresApproval ? "PENDING_REVIEW" : "NOT_REQUIRED";
    }

    public void approve(UUID approvedByMemberId, String note) {
        this.approvalStatus = "APPROVED";
        this.approvedBy = approvedByMemberId;
        this.approvedAt = Instant.now();
        this.reviewNote = note;
    }

    public void requestChanges(UUID reviewedByMemberId, String note) {
        this.approvalStatus = "CHANGES_REQUESTED";
        this.approvedBy = reviewedByMemberId;
        this.approvedAt = Instant.now();
        this.reviewNote = note;
    }

    public void fail(String errorMessage) {
        this.status = "FAILED";
        this.errorMessage = errorMessage;
        this.completedAt = Instant.now();
    }
}
