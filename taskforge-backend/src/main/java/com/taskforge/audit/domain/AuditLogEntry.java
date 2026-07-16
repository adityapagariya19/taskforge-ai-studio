package com.taskforge.audit.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * The single, append-only, compliance-grade ledger for the entire platform.
 * Every future module (billing, plugins, workflow engine, ...) writes here
 * instead of inventing its own logging mechanism — this is what makes a
 * future SOC2-style audit report a query, not a new feature.
 */
@Entity
@Table(name = "audit_logs_v2")
@Getter
@Setter
@NoArgsConstructor
public class AuditLogEntry {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "actor_organization_member_id")
    private UUID actorOrganizationMemberId; // null for system-initiated actions

    @Column(nullable = false)
    private String action;

    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    @Column(name = "resource_id")
    private UUID resourceId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String metadata = "{}";

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
