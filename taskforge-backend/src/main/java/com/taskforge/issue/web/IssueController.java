package com.taskforge.issue.web;

import com.taskforge.aiagent.domain.AgentType;
import com.taskforge.issue.application.IssueService;
import com.taskforge.issue.domain.Issue;
import com.taskforge.issue.domain.IssuePriority;
import com.taskforge.issue.domain.IssueType;
import com.taskforge.project.application.ProjectService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Authorization here is deliberately two-layered:
 *  1. @PreAuthorize("@permissionEvaluator.hasPermission(...)") — the org-wide
 *     RBAC check from Module 1 (docs/04): does this caller's role grant this
 *     permission code at all, anywhere in the organization?
 *  2. projectService.requireMember(...) — the project-local check: is this
 *     caller actually a member of *this specific* project (a permission like
 *     "issue:create" doesn't imply membership in every project in the org)?
 * Both must pass. This is the rewiring named as the top-priority gap in the
 * architectural audit — every endpoint below previously had only layer 2.
 */
@RestController
public class IssueController {

    private final IssueService issueService;
    private final ProjectService projectService;

    public IssueController(IssueService issueService, ProjectService projectService) {
        this.issueService = issueService;
        this.projectService = projectService;
    }

    public record CreateIssueRequest(IssueType type, String title, String description, IssuePriority priority, String epicId) {}
    public record PatchIssueRequest(String title, String description, IssuePriority priority,
                                     String assigneeUserId, AgentType assigneeAiType, Integer storyPoints) {}
    public record TransitionRequest(String statusId) {}

    public record IssueResponse(
            String id, String issueKey, String type, String statusId, String sprintId,
            String title, String description,
            String priority, Integer storyPoints, String assigneeId, boolean assigneeIsAi, String assigneeAiType,
            String reporterId, boolean reporterIsAi, String reporterAiType, String epicId,
            String createdAt, String updatedAt) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('issue:create')")
    @PostMapping("/api/v1/projects/{projectId}/issues")
    public IssueResponse create(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId,
                                 @RequestBody CreateIssueRequest req) {
        projectService.requireMember(projectId, userId);
        Issue issue = issueService.createIssue(projectId, userId, req.type(), req.title(), req.description(),
                req.priority(), req.epicId() == null ? null : UUID.fromString(req.epicId()));
        return toResponse(issue);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('issue:view')")
    @GetMapping("/api/v1/projects/{projectId}/issues")
    public List<IssueResponse> list(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) {
        projectService.requireMember(projectId, userId);
        return issueService.listByProject(projectId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('issue:view')")
    @GetMapping("/api/v1/issues/{issueId}")
    public IssueResponse get(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId) {
        Issue issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);
        return toResponse(issue);
    }

    @PreAuthorize("@permissionEvaluator.hasAnyPermission('issue:edit', 'issue:assign')")
    @PatchMapping("/api/v1/issues/{issueId}")
    public IssueResponse patch(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId,
                                @RequestBody PatchIssueRequest req) {
        Issue existing = issueService.getById(issueId);
        projectService.requireMember(existing.getProjectId(), userId);
        boolean reassigning = req.assigneeUserId() != null || req.assigneeAiType() != null;
        if (reassigning && !com.taskforge.permission.domain.OrgContext.current().hasPermission("issue:assign")) {
            throw new org.springframework.security.access.AccessDeniedException("Missing permission: issue:assign");
        }
        Issue updated = issueService.updatePatch(issueId, userId, req.title(), req.description(), req.priority(),
                req.assigneeUserId() == null ? null : UUID.fromString(req.assigneeUserId()),
                req.assigneeAiType(), req.storyPoints());
        return toResponse(updated);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('issue:transition')")
    @PostMapping("/api/v1/issues/{issueId}/transition")
    public IssueResponse transition(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId,
                                     @RequestBody TransitionRequest req) {
        Issue existing = issueService.getById(issueId);
        projectService.requireMember(existing.getProjectId(), userId);
        Issue updated = issueService.transition(issueId, UUID.fromString(req.statusId()), userId);
        return toResponse(updated);
    }

    private IssueResponse toResponse(Issue i) {
        return new IssueResponse(
                i.getId().toString(), i.getIssueKey(), i.getType().name(), i.getStatusId().toString(),
                i.getSprintId() == null ? null : i.getSprintId().toString(),
                i.getTitle(), i.getDescription(), i.getPriority().name(), i.getStoryPoints(),
                i.getAssigneeId() == null ? null : i.getAssigneeId().toString(), i.isAssigneeIsAi(),
                i.getAssigneeAiType() == null ? null : i.getAssigneeAiType().name(),
                i.getReporterId() == null ? null : i.getReporterId().toString(), i.isReporterIsAi(),
                i.getReporterAiType() == null ? null : i.getReporterAiType().name(),
                i.getEpicId() == null ? null : i.getEpicId().toString(),
                i.getCreatedAt().toString(), i.getUpdatedAt().toString());
    }
}
