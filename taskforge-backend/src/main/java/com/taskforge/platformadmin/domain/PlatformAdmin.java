package com.taskforge.platformadmin.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * Deliberately NOT a role on the regular `users`/`organization_members`
 * model. A platform admin can see across every tenant — granting that via
 * an in-org role would mean any org's RBAC configuration could theoretically
 * reach platform-wide capability, which breaks the tenant isolation
 * guarantee the whole RBAC system exists to provide. Keeping platform admins
 * in their own table, with their own JWT claim type, makes "platform admin"
 * and "organization member" structurally impossible to confuse.
 */
@Entity
@Table(name = "platform_admins")
@Getter
@Setter
@NoArgsConstructor
public class PlatformAdmin {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    public PlatformAdmin(String email, String passwordHash, String fullName) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
    }
}
