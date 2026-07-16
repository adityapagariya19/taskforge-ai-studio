package com.taskforge.permission.domain;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * The authenticated principal for every org-scoped request: who you are,
 * which organization you're acting in, which OrganizationMember row that
 * makes you, and a snapshot of your role's permission codes. Every
 * @PreAuthorize check and every service-layer guard in the platform reads
 * from this one object — this is the single authorization path described
 * in the Enterprise Platform Architecture doc (docs/04, section 4.5).
 */
public record OrgPrincipal(
        UUID userId,
        UUID organizationId,
        UUID organizationMemberId,
        String roleCode,
        Set<String> permissionCodes
) {
    public boolean hasPermission(String code) {
        return permissionCodes.contains(code);
    }

    public static OrgPrincipal from(UUID userId, UUID organizationId, UUID organizationMemberId,
                                     String roleCode, List<String> permissionCodes) {
        return new OrgPrincipal(userId, organizationId, organizationMemberId, roleCode, Set.copyOf(permissionCodes));
    }
}
