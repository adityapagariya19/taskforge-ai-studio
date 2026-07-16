package com.taskforge.platformadmin.web;

import com.taskforge.organization.domain.Organization;
import com.taskforge.platformadmin.application.PlatformAdminOrgService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Every endpoint here requires the PLATFORM_ADMIN authority — granted only
 * by a platform-admin-tier JWT (see JwtAuthFilter/JwtService). A regular
 * user's identity or org-scoped token, no matter how privileged their role
 * inside their own organization, cannot satisfy this check.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAuthority('PLATFORM_ADMIN')")
public class PlatformAdminOrgController {

    private final PlatformAdminOrgService orgService;

    public PlatformAdminOrgController(PlatformAdminOrgService orgService) {
        this.orgService = orgService;
    }

    public record OrgSummaryResponse(String id, String name, String slug, String joinCode, String planTier,
                                      String status, int memberCount, int aiAgentCount, String createdAt) {}
    public record SuspendRequest(String reason) {}
    public record StatsResponse(int totalOrganizations, int activeOrganizations, int suspendedOrganizations,
                                 int totalHumanMembers, int totalAiAgents) {}

    @GetMapping("/organizations")
    public List<OrgSummaryResponse> listOrganizations() {
        return orgService.listAllOrganizations().stream().map(this::toResponse).toList();
    }

    @GetMapping("/organizations/{id}")
    public OrgSummaryResponse getOrganization(@PathVariable UUID id) {
        Organization org = orgService.getById(id);
        var summary = orgService.listAllOrganizations().stream()
                .filter(s -> s.organization().getId().equals(id)).findFirst();
        return summary.map(this::toResponse).orElseGet(() -> new OrgSummaryResponse(
                org.getId().toString(), org.getName(), org.getSlug(), org.getJoinCode(),
                org.getPlanTier().name(), org.getStatus().name(), 0, 0, org.getCreatedAt().toString()));
    }

    @PostMapping("/organizations/{id}/suspend")
    public OrgSummaryResponse suspend(@AuthenticationPrincipal UUID adminId, @PathVariable UUID id,
                                       @RequestBody(required = false) SuspendRequest req) {
        orgService.suspend(adminId, id, req == null ? null : req.reason());
        return getOrganization(id);
    }

    @PostMapping("/organizations/{id}/reactivate")
    public OrgSummaryResponse reactivate(@AuthenticationPrincipal UUID adminId, @PathVariable UUID id) {
        orgService.reactivate(adminId, id);
        return getOrganization(id);
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        var s = orgService.getPlatformStats();
        return new StatsResponse(s.totalOrganizations(), s.activeOrganizations(), s.suspendedOrganizations(),
                s.totalHumanMembers(), s.totalAiAgents());
    }

    private OrgSummaryResponse toResponse(PlatformAdminOrgService.OrgSummary s) {
        Organization o = s.organization();
        return new OrgSummaryResponse(o.getId().toString(), o.getName(), o.getSlug(), o.getJoinCode(),
                o.getPlanTier().name(), o.getStatus().name(), s.memberCount(), s.aiAgentCount(), o.getCreatedAt().toString());
    }
}
