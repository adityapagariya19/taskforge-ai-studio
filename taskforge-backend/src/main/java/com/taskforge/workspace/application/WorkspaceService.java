package com.taskforge.workspace.application;

import com.taskforge.common.exception.ApiException;
import com.taskforge.organization.application.OrganizationService;
import com.taskforge.workspace.domain.Workspace;
import com.taskforge.workspace.infrastructure.WorkspaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Workspaces now live inside an Organization (the tenant root) and use the
 * single platform-wide authorization path — OrganizationService/Organization-
 * Member + the permission matrix — instead of the workspace-local
 * OWNER/ADMIN/MEMBER/GUEST role table this module used to maintain on its
 * own. That old table (workspace_members) is intentionally retired rather
 * than left running in parallel: a second, competing membership/authorization
 * system is precisely the kind of architectural debt Module 1 exists to
 * prevent (see docs/04, "no parallel auth system").
 */
@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final OrganizationService organizationService;

    public WorkspaceService(WorkspaceRepository workspaceRepository, OrganizationService organizationService) {
        this.workspaceRepository = workspaceRepository;
        this.organizationService = organizationService;
    }

    @Transactional
    public Workspace createWorkspace(UUID organizationId, String name) {
        String baseSlug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        String slug = baseSlug.isBlank() ? "workspace" : baseSlug;
        int suffix = 1;
        while (workspaceRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + (++suffix);
        }
        var organization = organizationService.getById(organizationId);
        Workspace workspace = new Workspace(organizationId, name, slug, organization.getOwnerId());
        return workspaceRepository.save(workspace);
    }

    public List<Workspace> findForOrganization(UUID organizationId) {
        return workspaceRepository.findByOrganizationId(organizationId);
    }

    public Workspace getById(UUID workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> ApiException.notFound("Workspace not found"));
    }

    /** Tenant-isolation guard: confirms the workspace actually belongs to the caller's active organization. */
    public Workspace requireBelongsToOrganization(UUID workspaceId, UUID organizationId) {
        Workspace workspace = getById(workspaceId);
        if (!workspace.getOrganizationId().equals(organizationId)) {
            throw ApiException.notFound("Workspace not found in this organization");
        }
        return workspace;
    }
}
