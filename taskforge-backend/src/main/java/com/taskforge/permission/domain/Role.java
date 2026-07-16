package com.taskforge.permission.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @UuidGenerator
    private UUID id;

    /** NULL = system template role, shared across all organizations until cloned. */
    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem = false;

    @Column(name = "is_ai", nullable = false)
    private boolean isAi = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "role_permissions",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions = new HashSet<>();

    public boolean grants(String permissionCode) {
        return permissions.stream().anyMatch(p -> p.getCode().equals(permissionCode));
    }
}
