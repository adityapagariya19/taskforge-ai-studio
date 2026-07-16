package com.taskforge.organization.domain;

import com.taskforge.aiagent.domain.AgentType;
import com.taskforge.permission.domain.Role;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * What a person (or AI agent) *is* inside one specific organization: their
 * role, department, job title. The same human User can have a different
 * OrganizationMember row — and therefore a completely different role — in
 * every organization they belong to.
 */
@Entity
@Table(name = "organization_members")
@Getter
@Setter
@NoArgsConstructor
public class OrganizationMember {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id")
    private UUID userId; // null when isAi = true

    @Column(name = "is_ai", nullable = false)
    private boolean isAi = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_agent_type")
    private AgentType aiAgentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "job_title")
    private String jobTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false)
    private EmploymentStatus employmentStatus = EmploymentStatus.ACTIVE;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt = Instant.now();

    @Column(name = "removed_at")
    private Instant removedAt;

    public static OrganizationMember human(UUID organizationId, UUID userId, Role role) {
        OrganizationMember m = new OrganizationMember();
        m.organizationId = organizationId;
        m.userId = userId;
        m.role = role;
        return m;
    }

    public static OrganizationMember ai(UUID organizationId, AgentType agentType, Role role) {
        OrganizationMember m = new OrganizationMember();
        m.organizationId = organizationId;
        m.isAi = true;
        m.aiAgentType = agentType;
        m.role = role;
        return m;
    }

    public boolean isActive() {
        return employmentStatus == EmploymentStatus.ACTIVE;
    }
}
