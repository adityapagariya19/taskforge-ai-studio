package com.taskforge.organization.application;

import com.taskforge.audit.application.AuditService;
import com.taskforge.common.exception.ApiException;
import com.taskforge.organization.domain.EmploymentStatus;
import com.taskforge.organization.domain.OrganizationMember;
import com.taskforge.organization.infrastructure.OrganizationMemberRepository;
import com.taskforge.permission.domain.OrgPrincipal;
import com.taskforge.permission.domain.Role;
import com.taskforge.permission.infrastructure.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class OrganizationMemberService {

    private final OrganizationMemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;

    public OrganizationMemberService(OrganizationMemberRepository memberRepository, RoleRepository roleRepository,
                                      AuditService auditService) {
        this.memberRepository = memberRepository;
        this.roleRepository = roleRepository;
        this.auditService = auditService;
    }

    public List<OrganizationMember> listMembers(UUID organizationId) {
        return memberRepository.findByOrganizationId(organizationId);
    }

    public OrganizationMember getById(UUID organizationMemberId) {
        return memberRepository.findById(organizationMemberId)
                .orElseThrow(() -> ApiException.notFound("Organization member not found"));
    }

    @Transactional
    public OrganizationMember changeRole(OrgPrincipal actingAs, UUID organizationId, UUID targetMemberId, String newRoleCode) {
        OrganizationMember target = getById(targetMemberId);
        if (!target.getOrganizationId().equals(organizationId)) {
            throw ApiException.badRequest("Member does not belong to this organization");
        }
        Role newRole = roleRepository.findByOrganizationIdAndCode(organizationId, newRoleCode)
                .orElseThrow(() -> ApiException.notFound("Role not found in this organization: " + newRoleCode));

        if ("ORG_OWNER".equals(target.getRole().getCode()) && !"ORG_OWNER".equals(newRoleCode)) {
            long ownerCount = memberRepository.findByOrganizationId(organizationId).stream()
                    .filter(m -> m.isActive() && "ORG_OWNER".equals(m.getRole().getCode())).count();
            if (ownerCount <= 1) {
                throw ApiException.badRequest("Cannot demote the last remaining Organization Owner");
            }
        }

        String oldRoleCode = target.getRole().getCode();
        target.setRole(newRole);
        memberRepository.save(target);

        auditService.record(organizationId, actingAs.organizationMemberId(), "MEMBER_ROLE_CHANGED",
                "ORGANIZATION_MEMBER", target.getId(),
                "{\"oldRole\":\"" + oldRoleCode + "\",\"newRole\":\"" + newRoleCode + "\"}");
        return target;
    }

    @Transactional
    public void removeMember(OrgPrincipal actingAs, UUID organizationId, UUID targetMemberId) {
        OrganizationMember target = getById(targetMemberId);
        if (!target.getOrganizationId().equals(organizationId)) {
            throw ApiException.badRequest("Member does not belong to this organization");
        }
        if ("ORG_OWNER".equals(target.getRole().getCode())) {
            throw ApiException.badRequest("Cannot remove the Organization Owner — transfer ownership first");
        }
        target.setEmploymentStatus(EmploymentStatus.REMOVED);
        target.setRemovedAt(java.time.Instant.now());
        memberRepository.save(target);

        auditService.record(organizationId, actingAs.organizationMemberId(), "MEMBER_REMOVED",
                "ORGANIZATION_MEMBER", target.getId(), "{}");
    }

    public void requireActiveMembership(UUID organizationId, UUID organizationMemberId) {
        OrganizationMember member = getById(organizationMemberId);
        if (!member.getOrganizationId().equals(organizationId) || !member.isActive()) {
            throw ApiException.forbidden("Not an active member of this organization");
        }
    }
}
