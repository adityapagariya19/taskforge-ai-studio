package com.taskforge.permission.application;

import com.taskforge.permission.domain.OrgContext;
import org.springframework.stereotype.Component;

/**
 * The single authorization check every protected endpoint in the platform
 * calls, e.g.:
 *
 *   @PreAuthorize("@permissionEvaluator.hasPermission('issue:delete')")
 *
 * Reads from the current request's org-scoped permission snapshot
 * (OrgContext) — no DB hit per request. The snapshot is refreshed every time
 * a user calls /organizations/{id}/activate, which happens on login and on
 * every organization switch; a role change therefore takes effect on the
 * member's next activation, which is the same trust model used by, e.g.,
 * GitHub App installation tokens. Bean name "permissionEvaluator" is
 * referenced literally by the @PreAuthorize SpEL expressions above.
 */
@Component("permissionEvaluator")
public class PermissionEvaluator {

    public boolean hasPermission(String permissionCode) {
        return OrgContext.current().hasPermission(permissionCode);
    }

    public boolean hasAnyPermission(String... permissionCodes) {
        var principal = OrgContext.current();
        for (String code : permissionCodes) {
            if (principal.hasPermission(code)) return true;
        }
        return false;
    }

    public boolean isRole(String roleCode) {
        return OrgContext.current().roleCode().equals(roleCode);
    }
}
