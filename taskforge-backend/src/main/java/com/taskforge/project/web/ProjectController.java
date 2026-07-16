package com.taskforge.project.web;

import com.taskforge.permission.application.PermissionEvaluator;
import com.taskforge.project.application.ProjectService;
import com.taskforge.project.domain.Project;
import com.taskforge.project.domain.ProjectMember;
import com.taskforge.project.domain.ProjectRole;
import com.taskforge.project.domain.ProjectType;
import com.taskforge.project.domain.WorkflowStatus;
import com.taskforge.workspace.application.WorkspaceService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ProjectController {

    private final ProjectService projectService;
    private final WorkspaceService workspaceService;
    private final PermissionEvaluator permissionEvaluator;

    public ProjectController(ProjectService projectService, WorkspaceService workspaceService,
                              PermissionEvaluator permissionEvaluator) {
        this.projectService = projectService;
        this.workspaceService = workspaceService;
        this.permissionEvaluator = permissionEvaluator;
    }

    public record CreateProjectRequest(String key, String name, String description, ProjectType type) {}
    public record ProjectResponse(String id, String key, String name, String description, String type) {}
    public record StatusResponse(String id, String name, String category, int position, String color) {}
    public record AddMemberRequest(String userId, ProjectRole role) {}
    public record MemberResponse(String id, String userId, boolean isAi, String aiAgentType, String role) {}

    @PostMapping("/api/v1/workspaces/{workspaceId}/projects")
    public ProjectResponse create(@AuthenticationPrincipal UUID userId, @PathVariable UUID workspaceId,
                                   @RequestBody CreateProjectRequest req) {
        requireWorkspacePermission(workspaceId, "project:create");
        Project project = projectService.createProject(workspaceId, userId, req.key(), req.name(),
                req.description(), req.type() == null ? ProjectType.KANBAN : req.type());
        return toResponse(project);
    }

    @GetMapping("/api/v1/workspaces/{workspaceId}/projects")
    public List<ProjectResponse> list(@AuthenticationPrincipal UUID userId, @PathVariable UUID workspaceId) {
        requireWorkspacePermission(workspaceId, "project:view");
        return projectService.findByWorkspace(workspaceId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('project:view')")
    @GetMapping("/api/v1/projects/{projectId}")
    public ProjectResponse get(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) {
        projectService.requireMember(projectId, userId);
        return toResponse(projectService.getById(projectId));
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('project:view')")
    @GetMapping("/api/v1/projects/{projectId}/statuses")
    public List<StatusResponse> statuses(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) {
        projectService.requireMember(projectId, userId);
        return projectService.getWorkflowStatuses(projectId).stream()
                .map(s -> new StatusResponse(s.getId().toString(), s.getName(), s.getCategory().name(), s.getPosition(), s.getColor()))
                .toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('member:view')")
    @GetMapping("/api/v1/projects/{projectId}/members")
    public List<MemberResponse> members(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) {
        projectService.requireMember(projectId, userId);
        return projectService.listMembers(projectId).stream()
                .map(m -> new MemberResponse(m.getId().toString(),
                        m.getUserId() == null ? null : m.getUserId().toString(),
                        m.isAi(),
                        m.getAiAgentType() == null ? null : m.getAiAgentType().name(),
                        m.getRole().name()))
                .toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('project:manage')")
    @PostMapping("/api/v1/projects/{projectId}/members")
    public MemberResponse addMember(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId,
                                     @RequestBody AddMemberRequest req) {
        projectService.requireMember(projectId, userId);
        ProjectMember member = projectService.addHumanMember(projectId, UUID.fromString(req.userId()), req.role());
        return new MemberResponse(member.getId().toString(), member.getUserId().toString(), false, null, member.getRole().name());
    }

    private ProjectResponse toResponse(Project p) {
        return new ProjectResponse(p.getId().toString(), p.getKey(), p.getName(), p.getDescription(), p.getType().name());
    }

    /**
     * Confirms the workspace belongs to the caller's currently active
     * organization (tenant isolation) and that their role carries the given
     * permission code — the same single authorization path every other
     * module in the platform uses (see docs/04 §4.5).
     */
    private void requireWorkspacePermission(UUID workspaceId, String permissionCode) {
        var principal = com.taskforge.permission.domain.OrgContext.current();
        var workspace = workspaceService.requireBelongsToOrganization(workspaceId, principal.organizationId());
        if (!principal.hasPermission(permissionCode)) {
            throw new AccessDeniedException("Missing permission: " + permissionCode);
        }
    }
}
