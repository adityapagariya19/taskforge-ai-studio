package com.taskforge.project.domain;

import com.taskforge.aiagent.domain.AgentType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_members")
@Getter
@Setter
@NoArgsConstructor
public class ProjectMember {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "user_id")
    private UUID userId; // null when isAi = true

    @Column(name = "is_ai", nullable = false)
    private boolean isAi = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_agent_type")
    private AgentType aiAgentType; // set when isAi = true

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectRole role;

    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt = Instant.now();

    public static ProjectMember human(UUID projectId, UUID userId, ProjectRole role) {
        ProjectMember m = new ProjectMember();
        m.projectId = projectId;
        m.userId = userId;
        m.isAi = false;
        m.role = role;
        return m;
    }

    public static ProjectMember ai(UUID projectId, AgentType agentType) {
        ProjectMember m = new ProjectMember();
        m.projectId = projectId;
        m.isAi = true;
        m.aiAgentType = agentType;
        m.role = ProjectRole.AI_AGENT;
        return m;
    }
}
