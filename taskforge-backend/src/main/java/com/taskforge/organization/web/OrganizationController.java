package com.taskforge.organization.web;

import com.taskforge.organization.application.OrganizationService;
import com.taskforge.organization.domain.Organization;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    public record CreateOrganizationRequest(@NotBlank String name) {}
    public record OrganizationResponse(String id, String name, String slug, String planTier, String status) {}
    public record ActivateResponse(String accessToken, String organizationId, String roleCode) {}

    @PostMapping
    public OrganizationResponse create(@AuthenticationPrincipal UUID userId, @jakarta.validation.Valid @RequestBody CreateOrganizationRequest req) {
        Organization org = organizationService.createOrganization(userId, req.name());
        return toResponse(org);
    }

    @GetMapping
    public List<OrganizationResponse> myOrganizations(@AuthenticationPrincipal UUID userId) {
        return organizationService.findForUser(userId).stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public OrganizationResponse get(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        organizationService.requireMembership(id, userId);
        return toResponse(organizationService.getById(id));
    }

    /**
     * Issues an organization-scoped token. The frontend must call this right
     * after login (auto-selecting the user's only/most-recent organization)
     * and again every time the user switches organizations in the UI.
     */
    @PostMapping("/{id}/activate")
    public ActivateResponse activate(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        String token = organizationService.activate(userId, id);
        var member = organizationService.requireMembership(id, userId);
        return new ActivateResponse(token, id.toString(), member.getRole().getCode());
    }

    private OrganizationResponse toResponse(Organization o) {
        return new OrganizationResponse(o.getId().toString(), o.getName(), o.getSlug(),
                o.getPlanTier().name(), o.getStatus().name());
    }
}
