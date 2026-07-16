package com.taskforge.organization.application;

import com.taskforge.audit.application.AuditService;
import com.taskforge.common.exception.ApiException;
import com.taskforge.identity.application.JwtService;
import com.taskforge.identity.infrastructure.UserRepository;
import com.taskforge.organization.domain.EmploymentStatus;
import com.taskforge.organization.domain.Organization;
import com.taskforge.organization.domain.OrganizationMember;
import com.taskforge.organization.infrastructure.OrganizationMemberRepository;
import com.taskforge.organization.infrastructure.OrganizationRepository;
import com.taskforge.permission.application.RoleTemplateService;
import com.taskforge.permission.domain.Permission;
import com.taskforge.permission.domain.Role;
import com.taskforge.permission.infrastructure.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final RoleTemplateService roleTemplateService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditService auditService;

    public OrganizationService(OrganizationRepository organizationRepository, OrganizationMemberRepository memberRepository,
                                RoleRepository roleRepository, RoleTemplateService roleTemplateService,
                                UserRepository userRepository, JwtService jwtService, AuditService auditService) {
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.roleRepository = roleRepository;
        this.roleTemplateService = roleTemplateService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional
    public Organization createOrganization(UUID ownerId, String name) {
        String baseSlug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        String slug = baseSlug.isBlank() ? "organization" : baseSlug;
        int suffix = 1;
        while (organizationRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + (++suffix);
        }

        Organization organization = new Organization(name, slug, ownerId);
        organizationRepository.save(organization);

        // Clone all 16 system role templates into this organization — every
        // org gets its own copy from day one (Architecture doc §4.2).
        roleTemplateService.cloneSystemRolesInto(organization.getId());

        Role ownerRole = roleRepository.findByOrganizationIdAndCode(organization.getId(), "ORG_OWNER")
                .orElseThrow(() -> new IllegalStateException("ORG_OWNER role was not cloned correctly"));

        OrganizationMember ownerMember = OrganizationMember.human(organization.getId(), ownerId, ownerRole);
        memberRepository.save(ownerMember);

        auditService.record(organization.getId(), ownerMember.getId(), "ORGANIZATION_CREATED",
                "ORGANIZATION", organization.getId(), "{\"name\":\"" + escape(name) + "\"}");

        return organization;
    }

    public List<Organization> findForUser(UUID userId) {
        List<UUID> orgIds = memberRepository.findByUserId(userId).stream()
                .filter(OrganizationMember::isActive)
                .map(OrganizationMember::getOrganizationId)
                .toList();
        return organizationRepository.findAllById(orgIds);
    }

    public Organization getById(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> ApiException.notFound("Organization not found"));
    }

    public OrganizationMember requireMembership(UUID organizationId, UUID userId) {
        OrganizationMember member = memberRepository.findByOrganizationIdAndUserId(organizationId, userId)
                .orElseThrow(() -> ApiException.forbidden("Not a member of this organization"));
        if (!member.isActive()) {
            throw ApiException.forbidden("Your membership in this organization is not active");
        }
        return member;
    }

    /**
     * Issues an organization-scoped JWT for an already-authenticated user:
     * the real implementation of "organization switching" — every call
     * re-resolves the member's current role and snapshots its permissions
     * fresh, so a role change takes effect on the member's next activation.
     */
    public String activate(UUID userId, UUID organizationId) {
        OrganizationMember member = requireMembership(organizationId, userId);
        Role role = member.getRole();
        List<String> permissionCodes = role.getPermissions().stream().map(Permission::getCode).toList();
        String email = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"))
                .getEmail();
        return jwtService.generateOrgScopedToken(userId, email, organizationId, member.getId(), role.getCode(), permissionCodes);
    }

    private String escape(String s) { return s.replace("\"", "\\\""); }
}
