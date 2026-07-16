package com.taskforge.department.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
public class Department {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String name;

    @Column(name = "parent_department_id")
    private UUID parentDepartmentId;

    @Column(name = "lead_organization_member_id")
    private UUID leadOrganizationMemberId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Department(UUID organizationId, String name, UUID parentDepartmentId) {
        this.organizationId = organizationId;
        this.name = name;
        this.parentDepartmentId = parentDepartmentId;
    }
}
