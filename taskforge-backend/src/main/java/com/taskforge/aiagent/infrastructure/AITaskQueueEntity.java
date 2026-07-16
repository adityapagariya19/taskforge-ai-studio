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
@Table(name = "ai_task_queue")
@Getter
@Setter
@NoArgsConstructor
public class AITaskQueueEntity {

    public static final String QUEUED = "QUEUED";
    public static final String PROCESSING = "PROCESSING";
    public static final String DONE = "DONE";
    public static final String FAILED = "FAILED";

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
    private String status = QUEUED;

    @Column(name = "retry_count", nullable = false)
    private int retryCount = 0;

    @Column(name = "enqueued_at", nullable = false, updatable = false)
    private Instant enqueuedAt = Instant.now();

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    public static AITaskQueueEntity queued(UUID issueId, AgentType agentType, String triggerEvent) {
        return queued(issueId, agentType, triggerEvent, null);
    }

    public static AITaskQueueEntity queued(UUID issueId, AgentType agentType, String triggerEvent, String instructions) {
        AITaskQueueEntity e = new AITaskQueueEntity();
        e.issueId = issueId;
        e.agentType = agentType;
        e.triggerEvent = triggerEvent;
        e.instructions = instructions;
        return e;
    }

    public void markProcessing() {
        this.status = PROCESSING;
        this.startedAt = Instant.now();
    }

    public void markDone() {
        this.status = DONE;
        this.finishedAt = Instant.now();
    }

    public void markFailedAndMaybeRetry() {
        this.retryCount++;
        if (this.retryCount >= 3) {
            this.status = FAILED;
            this.finishedAt = Instant.now();
        } else {
            this.status = QUEUED; // will be picked up again on the next poll
        }
    }
}
