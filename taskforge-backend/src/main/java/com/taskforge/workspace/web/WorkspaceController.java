package com.taskforge.workspace.web;

import com.taskforge.permission.domain.OrgContext;
import com.taskforge.workspace.application.WorkspaceService;
import com.taskforge.workspace.domain.Workspace;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/{organizationId}/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    public record CreateWorkspaceRequest(String name) {}
    public record WorkspaceResponse(String id, String organizationId, String name, String slug) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('workspace:create')")
    @PostMapping
    public WorkspaceResponse create(@PathVariable UUID organizationId, @RequestBody CreateWorkspaceRequest req) {
        Workspace ws = workspaceService.createWorkspace(organizationId, req.name());
        return toResponse(ws);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('workspace:view')")
    @GetMapping
    public List<WorkspaceResponse> list(@PathVariable UUID organizationId) {
        return workspaceService.findForOrganization(organizationId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('workspace:view')")
    @GetMapping("/{id}")
    public WorkspaceResponse get(@PathVariable UUID organizationId, @PathVariable UUID id) {
        return toResponse(workspaceService.requireBelongsToOrganization(id, organizationId));
    }

    private WorkspaceResponse toResponse(Workspace ws) {
        return new WorkspaceResponse(ws.getId().toString(), ws.getOrganizationId().toString(), ws.getName(), ws.getSlug());
    }
}
