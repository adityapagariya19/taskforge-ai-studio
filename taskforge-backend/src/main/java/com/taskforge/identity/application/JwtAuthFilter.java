package com.taskforge.identity.application;

import com.taskforge.permission.domain.OrgPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Authenticates every request. The principal is always the caller's UUID
 * (so every existing `@AuthenticationPrincipal UUID userId` controller
 * parameter keeps working unchanged). When the token is organization-scoped,
 * the resolved {@link OrgPrincipal} is additionally attached as the
 * authentication's details — read via {@code OrgContext.current()} by any
 * controller/service that needs organization/role/permission context.
 * Platform admin tokens instead receive a single PLATFORM_ADMIN authority
 * and never carry an OrgPrincipal — the two token types are mutually
 * exclusive by construction (see JwtService).
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.isValid(token)) {
                UUID userId = jwtService.extractUserId(token);

                if (jwtService.isPlatformAdminToken(token)) {
                    var authentication = new UsernamePasswordAuthenticationToken(
                            userId, null, List.of(new SimpleGrantedAuthority("PLATFORM_ADMIN")));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    var authentication = new UsernamePasswordAuthenticationToken(userId, null, List.of());

                    if (jwtService.isOrgScoped(token)) {
                        OrgPrincipal orgPrincipal = OrgPrincipal.from(
                                userId,
                                jwtService.extractOrganizationId(token),
                                jwtService.extractOrganizationMemberId(token),
                                jwtService.extractRoleCode(token),
                                jwtService.extractPermissionCodes(token));
                        authentication.setDetails(orgPrincipal);
                    }

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
