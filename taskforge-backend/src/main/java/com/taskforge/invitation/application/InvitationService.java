package com.taskforge.invitation.application;

import com.taskforge.audit.application.AuditService;
import com.taskforge.common.exception.ApiException;
import com.taskforge.invitation.domain.Invitation;
import com.taskforge.invitation.domain.InvitationMethod;
import com.taskforge.invitation.domain.InvitationStatus;
import com.taskforge.invitation.infrastructure.InvitationRepository;
import com.taskforge.organization.domain.OrganizationMember;
import com.taskforge.organization.infrastructure.OrganizationMemberRepository;
import com.taskforge.permission.domain.OrgPrincipal;
import com.taskforge.permission.domain.Role;
import com.taskforge.permission.infrastructure.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;
    private final SecureRandom random = new SecureRandom();

    public InvitationService(InvitationRepository invitationRepository, OrganizationMemberRepository memberRepository,
                              RoleRepository roleRepository, AuditService auditService) {
        this.invitationRepository = invitationRepository;
        this.memberRepository = memberRepository;
        this.roleRepository = roleRepository;
        this.auditService = auditService;
    }

    @Transactional
    public Invitation create(OrgPrincipal actingAs, UUID organizationId, String email, String roleCode,
                              InvitationMethod method) {
        Role role = roleRepository.findByOrganizationIdAndCode(organizationId, roleCode)
                .orElseThrow(() -> ApiException.notFound("Role not found in this organization: " + roleCode));
        if (method == InvitationMethod.EMAIL && (email == null || email.isBlank())) {
            throw ApiException.badRequest("Email is required for EMAIL invitations");
        }

        Invitation invitation = new Invitation();
        invitation.setOrganizationId(organizationId);
        invitation.setEmail(email);
        invitation.setRoleId(role.getId());
        invitation.setInvitedBy(actingAs.organizationMemberId());
        invitation.setToken(generateToken());
        invitation.setMethod(method);
        invitation.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        invitationRepository.save(invitation);

        auditService.record(organizationId, actingAs.organizationMemberId(), "INVITATION_CREATED",
                "INVITATION", invitation.getId(), "{\"method\":\"" + method + "\",\"roleCode\":\"" + roleCode + "\"}");

        // Real email delivery is an explicit external integration point, not faked here:
        // wire a JavaMailSender/SES/SendGrid client in this method body when one is
        // configured via environment variables (see docs/04 §"cloud-first design").
        // The invitation record, token, and acceptance flow below are fully functional
        // regardless of whether the email transport is connected yet.
        return invitation;
    }

    @Transactional
    public OrganizationMember accept(UUID acceptingUserId, String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> ApiException.notFound("Invitation not found"));
        if (!invitation.isUsable()) {
            throw ApiException.badRequest("This invitation is no longer valid (expired, revoked, or already used)");
        }
        if (memberRepository.existsByOrganizationIdAndUserId(invitation.getOrganizationId(), acceptingUserId)) {
            throw ApiException.badRequest("You are already a member of this organization");
        }

        Role role = roleRepository.findById(invitation.getRoleId())
                .orElseThrow(() -> new IllegalStateException("Invitation references a role that no longer exists"));

        OrganizationMember member = OrganizationMember.human(invitation.getOrganizationId(), acceptingUserId, role);
        memberRepository.save(member);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(Instant.now());
        invitationRepository.save(invitation);

        auditService.record(invitation.getOrganizationId(), member.getId(), "INVITATION_ACCEPTED",
                "INVITATION", invitation.getId(), "{}");
        return member;
    }

    @Transactional
    public void reject(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> ApiException.notFound("Invitation not found"));
        invitation.setStatus(InvitationStatus.REJECTED);
        invitationRepository.save(invitation);
    }

    @Transactional
    public void revoke(OrgPrincipal actingAs, UUID organizationId, UUID invitationId) {
        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> ApiException.notFound("Invitation not found"));
        if (!invitation.getOrganizationId().equals(organizationId)) {
            throw ApiException.notFound("Invitation not found in this organization");
        }
        invitation.setStatus(InvitationStatus.REVOKED);
        invitationRepository.save(invitation);
        auditService.record(organizationId, actingAs.organizationMemberId(), "INVITATION_REVOKED",
                "INVITATION", invitationId, "{}");
    }

    public List<Invitation> listForOrganization(UUID organizationId) {
        return invitationRepository.findByOrganizationId(organizationId);
    }

    public Invitation getByToken(String token) {
        return invitationRepository.findByToken(token).orElseThrow(() -> ApiException.notFound("Invitation not found"));
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
