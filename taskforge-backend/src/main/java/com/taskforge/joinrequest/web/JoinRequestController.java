package com.taskforge.joinrequest.web;

import com.taskforge.joinrequest.application.JoinRequestService;
import com.taskforge.joinrequest.domain.JoinRequest;
import com.taskforge.joinrequest.domain.JoinRequestStatus;
import com.taskforge.organization.domain.Organization;
import com.taskforge.permission.domain.OrgContext;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class JoinRequestController {

    private final JoinRequestService joinRequestService;

    public JoinRequestController(JoinRequestService joinRequestService) {
        this.joinRequestService = joinRequestService;
    }

    public record SubmitRequest(@NotBlank String joinCode, String requestedRoleCode, String message) {}
    public record SubmitResponse(String organizationId, String organizationName, String requestId, String status) {}
    public record ReviewRequest(String reviewNote) {}
    public record JoinRequestResponse(String id, String organizationId, String userId, String requestedRoleCode,
                                       String message, String status, String reviewNote, String createdAt, String reviewedAt) {}

    /** Uses the identity-only token — the requester isn't a member yet, so no org-scoped context exists. */
    @PostMapping("/api/v1/join-requests")
    public SubmitResponse submit(@AuthenticationPrincipal UUID userId, @jakarta.validation.Valid @RequestBody SubmitRequest req) {
        JoinRequestService.SubmitResult result = joinRequestService.submitByCode(
                userId, req.joinCode(), req.requestedRoleCode(), req.message());
        return new SubmitResponse(result.organization().getId().toString(), result.organization().getName(),
                result.request().getId().toString(), result.request().getStatus().name());
    }

    @GetMapping("/api/v1/join-requests/mine")
    public List<JoinRequestResponse> mine(@AuthenticationPrincipal UUID userId) {
        return joinRequestService.listForUser(userId).stream().map(this::toResponse).toList();
    }

    @PostMapping("/api/v1/join-requests/{requestId}/withdraw")
    public void withdraw(@AuthenticationPrincipal UUID userId, @PathVariable UUID requestId) {
        joinRequestService.withdraw(userId, requestId);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('member:invite')")
    @GetMapping("/api/v1/organizations/{organizationId}/join-requests")
    public List<JoinRequestResponse> list(@PathVariable UUID organizationId,
                                           @RequestParam(required = false) JoinRequestStatus status) {
        return joinRequestService.listForOrganization(organizationId, status).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('member:invite')")
    @PostMapping("/api/v1/organizations/{organizationId}/join-requests/{requestId}/approve")
    public JoinRequestResponse approve(@PathVariable UUID organizationId, @PathVariable UUID requestId,
                                        @RequestBody(required = false) ReviewRequest req) {
        joinRequestService.approve(OrgContext.current(), organizationId, requestId, req == null ? null : req.reviewNote());
        return joinRequestService.listForOrganization(organizationId, null).stream()
                .filter(r -> r.getId().equals(requestId)).findFirst().map(this::toResponse).orElseThrow();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('member:invite')")
    @PostMapping("/api/v1/organizations/{organizationId}/join-requests/{requestId}/reject")
    public JoinRequestResponse reject(@PathVariable UUID organizationId, @PathVariable UUID requestId,
                                       @RequestBody(required = false) ReviewRequest req) {
        joinRequestService.reject(OrgContext.current(), organizationId, requestId, req == null ? null : req.reviewNote());
        return joinRequestService.listForOrganization(organizationId, null).stream()
                .filter(r -> r.getId().equals(requestId)).findFirst().map(this::toResponse).orElseThrow();
    }

    private JoinRequestResponse toResponse(JoinRequest r) {
        return new JoinRequestResponse(r.getId().toString(), r.getOrganizationId().toString(), r.getUserId().toString(),
                r.getRequestedRoleCode(), r.getMessage(), r.getStatus().name(), r.getReviewNote(),
                r.getCreatedAt().toString(), r.getReviewedAt() == null ? null : r.getReviewedAt().toString());
    }
}
