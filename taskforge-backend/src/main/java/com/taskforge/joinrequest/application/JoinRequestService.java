package com.taskforge.joinrequest.application;

import com.taskforge.audit.application.AuditService;
import com.taskforge.common.exception.ApiException;
import com.taskforge.identity.infrastructure.UserRepository;
import com.taskforge.joinrequest.domain.JoinRequest;
import com.taskforge.joinrequest.domain.JoinRequestStatus;
import com.taskforge.joinrequest.infrastructure.JoinRequestRepository;
import com.taskforge.notification.application.NotificationService;
import com.taskforge.notification.email.EmailService;
import com.taskforge.organization.domain.Organization;
import com.taskforge.organization.domain.OrganizationMember;
import com.taskforge.organization.infrastructure.OrganizationMemberRepository;
import com.taskforge.organization.infrastructure.OrganizationRepository;
import com.taskforge.permission.domain.OrgPrincipal;
import com.taskforge.permission.domain.Role;
import com.taskforge.permission.infrastructure.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class JoinRequestService {

    private final JoinRequestRepository joinRequestRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public JoinRequestService(JoinRequestRepository joinRequestRepository, OrganizationRepository organizationRepository,
                               OrganizationMemberRepository memberRepository, RoleRepository roleRepository,
                               AuditService auditService, NotificationService notificationService,
                               EmailService emailService, UserRepository userRepository) {
        this.joinRequestRepository = joinRequestRepository;
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.roleRepository = roleRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    public record SubmitResult(Organization organization, JoinRequest request) {}

    @Transactional
    public SubmitResult submitByCode(UUID userId, String joinCode, String requestedRoleCode, String message) {
        Organization organization = organizationRepository.findByJoinCode(joinCode.trim().toUpperCase())
                .orElseThrow(() -> ApiException.notFound("No organization found for that join code"));

        if (memberRepository.existsByOrganizationIdAndUserId(organization.getId(), userId)) {
            throw ApiException.badRequest("You are already a member of this organization");
        }
        if (joinRequestRepository.findByOrganizationIdAndUserIdAndStatus(
                organization.getId(), userId, JoinRequestStatus.PENDING).isPresent()) {
            throw ApiException.badRequest("You already have a pending request for this organization");
        }

        JoinRequest request = new JoinRequest(organization.getId(), userId, requestedRoleCode, message);
        joinRequestRepository.save(request);

        auditService.record(organization.getId(), null, "JOIN_REQUEST_SUBMITTED",
                "JOIN_REQUEST", request.getId(), "{}");

        // Notify every admin/owner in the org so the request is genuinely visible, not just queryable.
        String requesterEmail = userRepository.findById(userId).map(com.taskforge.identity.domain.User::getEmail).orElse("A user");
        memberRepository.findByOrganizationId(organization.getId()).stream()
                .filter(m -> !m.isAi() && m.isActive())
                .filter(m -> "ORG_OWNER".equals(m.getRole().getCode()) || "ORG_ADMIN".equals(m.getRole().getCode()))
                .forEach(admin -> {
                    notificationService.notify(admin.getUserId(), "JOIN_REQUEST",
                            "New join request for " + organization.getName(),
                            "Someone requested to join as " + request.getRequestedRoleCode(),
                            "/organization/requests", false);
                    userRepository.findById(admin.getUserId()).ifPresent(adminUser ->
                            emailService.sendJoinRequestReceived(adminUser.getEmail(), organization.getName(),
                                    requesterEmail, request.getRequestedRoleCode()));
                });

        return new SubmitResult(organization, request);
    }

    public List<JoinRequest> listForOrganization(UUID organizationId, JoinRequestStatus status) {
        return status == null
                ? joinRequestRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId)
                : joinRequestRepository.findByOrganizationIdAndStatusOrderByCreatedAtDesc(organizationId, status);
    }

    public List<JoinRequest> listForUser(UUID userId) {
        return joinRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public OrganizationMember approve(OrgPrincipal actingAs, UUID organizationId, UUID requestId, String reviewNote) {
        JoinRequest request = getOwned(organizationId, requestId);
        if (request.getStatus() != JoinRequestStatus.PENDING) {
            throw ApiException.badRequest("This request has already been reviewed");
        }

        Role role = roleRepository.findByOrganizationIdAndCode(organizationId, request.getRequestedRoleCode())
                .orElseThrow(() -> ApiException.notFound("Role not found: " + request.getRequestedRoleCode()));

        OrganizationMember member = OrganizationMember.human(organizationId, request.getUserId(), role);
        memberRepository.save(member);

        request.setStatus(JoinRequestStatus.APPROVED);
        request.setReviewedBy(actingAs.organizationMemberId());
        request.setReviewNote(reviewNote);
        request.setReviewedAt(Instant.now());
        joinRequestRepository.save(request);

        auditService.record(organizationId, actingAs.organizationMemberId(), "JOIN_REQUEST_APPROVED",
                "JOIN_REQUEST", request.getId(), "{}");
        notificationService.notify(request.getUserId(), "JOIN_REQUEST_APPROVED",
                "Your request was approved", "You're now a member — welcome aboard.", "/dashboard", false);
        Organization org = organizationRepository.findById(organizationId).orElse(null);
        if (org != null) {
            userRepository.findById(request.getUserId()).ifPresent(requester ->
                    emailService.sendJoinRequestDecision(requester.getEmail(), org.getName(), true, null));
        }

        return member;
    }

    @Transactional
    public void reject(OrgPrincipal actingAs, UUID organizationId, UUID requestId, String reviewNote) {
        JoinRequest request = getOwned(organizationId, requestId);
        if (request.getStatus() != JoinRequestStatus.PENDING) {
            throw ApiException.badRequest("This request has already been reviewed");
        }
        request.setStatus(JoinRequestStatus.REJECTED);
        request.setReviewedBy(actingAs.organizationMemberId());
        request.setReviewNote(reviewNote);
        request.setReviewedAt(Instant.now());
        joinRequestRepository.save(request);

        auditService.record(organizationId, actingAs.organizationMemberId(), "JOIN_REQUEST_REJECTED",
                "JOIN_REQUEST", request.getId(), "{}");
        notificationService.notify(request.getUserId(), "JOIN_REQUEST_REJECTED",
                "Your request was declined", reviewNote, "/", false);
        organizationRepository.findById(organizationId).ifPresent(org ->
                userRepository.findById(request.getUserId()).ifPresent(requester ->
                        emailService.sendJoinRequestDecision(requester.getEmail(), org.getName(), false, reviewNote)));
    }

    @Transactional
    public void withdraw(UUID userId, UUID requestId) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Request not found"));
        if (!request.getUserId().equals(userId)) throw ApiException.forbidden("Not your request");
        if (request.getStatus() != JoinRequestStatus.PENDING) throw ApiException.badRequest("Only pending requests can be withdrawn");
        request.setStatus(JoinRequestStatus.WITHDRAWN);
        request.setReviewedAt(Instant.now());
        joinRequestRepository.save(request);
    }

    private JoinRequest getOwned(UUID organizationId, UUID requestId) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> ApiException.notFound("Join request not found"));
        if (!request.getOrganizationId().equals(organizationId)) {
            throw ApiException.notFound("Join request not found in this organization");
        }
        return request;
    }
}
