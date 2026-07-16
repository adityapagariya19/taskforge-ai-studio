package com.taskforge.invitation.web;

import com.taskforge.invitation.application.InvitationService;
import com.taskforge.invitation.domain.Invitation;
import com.taskforge.invitation.domain.InvitationMethod;
import com.taskforge.organization.application.OrganizationMemberService;
import com.taskforge.organization.domain.OrganizationMember;
import com.taskforge.permission.domain.OrgContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    public record CreateRequest(String email, String roleCode, InvitationMethod method) {}
    public record InvitationResponse(String id, String email, String roleId, String token, String method,
                                      String status, String expiresAt, String createdAt) {}
    public record AcceptRequest(String token) {}
    public record MemberResponse(String id, String organizationId, String roleCode) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('invitation:create')")
    @PostMapping("/api/v1/organizations/{organizationId}/invitations")
    public InvitationResponse create(@PathVariable UUID organizationId, @RequestBody CreateRequest req) {
        Invitation invitation = invitationService.create(OrgContext.current(), organizationId,
                req.email(), req.roleCode(), req.method());
        return toResponse(invitation);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('invitation:create')")
    @GetMapping("/api/v1/organizations/{organizationId}/invitations")
    public List<InvitationResponse> list(@PathVariable UUID organizationId) {
        return invitationService.listForOrganization(organizationId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('invitation:revoke')")
    @DeleteMapping("/api/v1/organizations/{organizationId}/invitations/{invitationId}")
    public void revoke(@PathVariable UUID organizationId, @PathVariable UUID invitationId) {
        invitationService.revoke(OrgContext.current(), organizationId, invitationId);
    }

    // Accept/reject use the identity-only token — the user is not yet a
    // member of the target organization, so no org-scoped context exists.
    @PostMapping("/api/v1/invitations/accept")
    public MemberResponse accept(@AuthenticationPrincipal UUID userId, @RequestBody AcceptRequest req) {
        OrganizationMember member = invitationService.accept(userId, req.token());
        return new MemberResponse(member.getId().toString(), member.getOrganizationId().toString(), member.getRole().getCode());
    }

    @PostMapping("/api/v1/invitations/reject")
    public void reject(@RequestBody AcceptRequest req) {
        invitationService.reject(req.token());
    }

    @GetMapping("/api/v1/invitations/{token}")
    public InvitationResponse getByToken(@PathVariable String token) {
        return toResponse(invitationService.getByToken(token));
    }

    private InvitationResponse toResponse(Invitation i) {
        return new InvitationResponse(i.getId().toString(), i.getEmail(), i.getRoleId().toString(), i.getToken(),
                i.getMethod().name(), i.getStatus().name(), i.getExpiresAt().toString(), i.getCreatedAt().toString());
    }
}
