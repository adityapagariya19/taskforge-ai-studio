package com.taskforge.permission.domain;

import com.taskforge.common.exception.ApiException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Static accessor for the current request's {@link OrgPrincipal}, when one
 * exists (i.e. the caller authenticated with an organization-scoped token).
 * This is the one place every controller/service in the platform goes to
 * answer "which organization, which member, which role, which permissions
 * does this request have?" — see Enterprise Platform Architecture doc §4.5.
 */
public final class OrgContext {

    private OrgContext() {}

    public static OrgPrincipal current() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof UsernamePasswordAuthenticationToken token && token.getDetails() instanceof OrgPrincipal p) {
            return p;
        }
        throw ApiException.unauthorized(
                "This endpoint requires an organization-scoped token. Call POST /api/v1/organizations/{id}/activate first.");
    }

    public static boolean isPresent() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth instanceof UsernamePasswordAuthenticationToken token && token.getDetails() instanceof OrgPrincipal;
    }
}
