package com.taskforge.activity.domain;

import com.taskforge.aiagent.domain.AgentType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
public class ActivityLog {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "issue_id")
    private UUID issueId;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_is_ai", nullable = false)
    private boolean actorIsAi = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_ai_type")
    private AgentType actorAiType;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "field_name")
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
