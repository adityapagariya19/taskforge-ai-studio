package com.taskforge.activity.web;

import com.taskforge.activity.application.ActivityLogService;
import com.taskforge.activity.domain.ActivityLog;
import com.taskforge.issue.application.IssueService;
import com.taskforge.project.application.ProjectService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/issues/{issueId}/activity")
public class ActivityController {

    private final ActivityLogService activityLogService;
    private final IssueService issueService;
    private final ProjectService projectService;

    public ActivityController(ActivityLogService activityLogService, IssueService issueService, ProjectService projectService) {
        this.activityLogService = activityLogService;
        this.issueService = issueService;
        this.projectService = projectService;
    }

    public record ActivityResponse(String id, String actorId, boolean actorIsAi, String actorAiType,
                                    String actionType, String fieldName, String oldValue, String newValue, String createdAt) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('issue:view')")
    @GetMapping
    public List<ActivityResponse> list(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId) {
        var issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);
        return activityLogService.listByIssue(issueId).stream().map(this::toResponse).toList();
    }

    private ActivityResponse toResponse(ActivityLog a) {
        return new ActivityResponse(a.getId().toString(), a.getActorId() == null ? null : a.getActorId().toString(),
                a.isActorIsAi(), a.getActorAiType() == null ? null : a.getActorAiType().name(),
                a.getActionType(), a.getFieldName(), a.getOldValue(), a.getNewValue(), a.getCreatedAt().toString());
    }
}
