package com.taskforge.platformadmin.application;

import com.taskforge.common.exception.ApiException;
import com.taskforge.organization.domain.Organization;
import com.taskforge.organization.domain.OrganizationStatus;
import com.taskforge.organization.infrastructure.OrganizationMemberRepository;
import com.taskforge.organization.infrastructure.OrganizationRepository;
import com.taskforge.audit.application.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Platform-wide oversight — the operations only a platform admin (never an
 * organization's own Owner/Admin) can perform. Every mutating action here
 * is recorded through the same AuditService every organization uses, with
 * actorOrganizationMemberId left null (there is no OrganizationMember for a
 * platform admin — see PlatformAdmin's Javadoc) so these entries are
 * unambiguously platform-level in the audit trail.
 */
@Service
public class PlatformAdminOrgService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final AuditService auditService;

    public PlatformAdminOrgService(OrganizationRepository organizationRepository,
                                    OrganizationMemberRepository memberRepository,
                                    AuditService auditService) {
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.auditService = auditService;
    }

    public record OrgSummary(Organization organization, int memberCount, int aiAgentCount) {}

    public List<OrgSummary> listAllOrganizations() {
        return organizationRepository.findAll().stream()
                .map(org -> {
                    var members = memberRepository.findByOrganizationId(org.getId());
                    int humanCount = (int) members.stream().filter(m -> !m.isAi() && m.isActive()).count();
                    int aiCount = (int) members.stream().filter(com.taskforge.organization.domain.OrganizationMember::isAi).count();
                    return new OrgSummary(org, humanCount, aiCount);
                })
                .toList();
    }

    public Organization getById(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> ApiException.notFound("Organization not found"));
    }

    @Transactional
    public Organization suspend(UUID platformAdminId, UUID organizationId, String reason) {
        Organization org = getById(organizationId);
        org.setStatus(OrganizationStatus.SUSPENDED);
        organizationRepository.save(org);
        auditService.record(organizationId, null, "PLATFORM_ADMIN_SUSPENDED_ORG",
                "ORGANIZATION", organizationId, "{\"reason\":\"" + esc(reason) + "\",\"platformAdminId\":\"" + platformAdminId + "\"}");
        return org;
    }

    @Transactional
    public Organization reactivate(UUID platformAdminId, UUID organizationId) {
        Organization org = getById(organizationId);
        org.setStatus(OrganizationStatus.ACTIVE);
        organizationRepository.save(org);
        auditService.record(organizationId, null, "PLATFORM_ADMIN_REACTIVATED_ORG",
                "ORGANIZATION", organizationId, "{\"platformAdminId\":\"" + platformAdminId + "\"}");
        return org;
    }

    public record PlatformStats(int totalOrganizations, int activeOrganizations, int suspendedOrganizations,
                                 int totalHumanMembers, int totalAiAgents) {}

    public PlatformStats getPlatformStats() {
        List<Organization> all = organizationRepository.findAll();
        int active = (int) all.stream().filter(o -> o.getStatus() == OrganizationStatus.ACTIVE).count();
        int suspended = (int) all.stream().filter(o -> o.getStatus() == OrganizationStatus.SUSPENDED).count();
        int humans = 0, ais = 0;
        for (Organization org : all) {
            var members = memberRepository.findByOrganizationId(org.getId());
            humans += members.stream().filter(m -> !m.isAi() && m.isActive()).count();
            ais += members.stream().filter(com.taskforge.organization.domain.OrganizationMember::isAi).count();
        }
        return new PlatformStats(all.size(), active, suspended, humans, ais);
    }

    private String esc(String s) { return s == null ? "" : s.replace("\"", "\\\""); }
}
