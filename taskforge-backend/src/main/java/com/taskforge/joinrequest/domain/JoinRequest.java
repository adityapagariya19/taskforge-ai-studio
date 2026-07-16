package com.taskforge.joinrequest.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * An employee-initiated request to join an organization via its join code —
 * distinct from the admin-initiated `Invitation` (Module 1). This is a real
 * state machine: PENDING -> APPROVED/REJECTED (by an org admin/owner) or
 * PENDING -> WITHDRAWN (by the requester). Approval is what actually creates
 * the OrganizationMember row; nothing here grants membership on its own.
 */
@Entity
@Table(name = "join_requests")
@Getter
@Setter
@NoArgsConstructor
public class JoinRequest {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "requested_role_code", nullable = false)
    private String requestedRoleCode = "DEVELOPER";

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JoinRequestStatus status = JoinRequestStatus.PENDING;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    public JoinRequest(UUID organizationId, UUID userId, String requestedRoleCode, String message) {
        this.organizationId = organizationId;
        this.userId = userId;
        this.requestedRoleCode = requestedRoleCode == null ? "DEVELOPER" : requestedRoleCode;
        this.message = message;
    }
}
