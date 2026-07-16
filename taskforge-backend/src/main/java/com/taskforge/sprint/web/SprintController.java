package com.taskforge.sprint.web;

import com.taskforge.permission.domain.OrgContext;
import com.taskforge.project.application.ProjectService;
import com.taskforge.sprint.application.SprintService;
import com.taskforge.sprint.domain.Sprint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/sprints")
public class SprintController {

    private final SprintService sprintService;
    private final ProjectService projectService;

    public SprintController(SprintService sprintService, ProjectService projectService) {
        this.sprintService = sprintService;
        this.projectService = projectService;
    }

    public record CreateSprintRequest(
            @NotBlank String name,
            String goal,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate) {}

    public record StartSprintRequest() {}

    public record CompleteSprintRequest(String moveIncompleteToSprintId) {}

    public record AddIssueRequest(@NotNull String issueId) {}

    public record SprintResponse(String id, String projectId, String name, String goal,
                                  String startDate, String endDate, String status,
                                  String createdAt, String startedAt, String completedAt) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:view')")
    @GetMapping
    public List<SprintResponse> list(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) {
        projectService.requireMember(projectId, userId);
        return sprintService.listForProject(projectId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:view')")
    @GetMapping("/active")
    public SprintResponse active(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) {
        projectService.requireMember(projectId, userId);
        return sprintService.getActiveForProject(projectId)
                .map(this::toResponse)
                .orElseThrow(() -> com.taskforge.common.exception.ApiException.notFound("No active sprint"));
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:view')")
    @GetMapping("/{sprintId}")
    public SprintResponse get(@AuthenticationPrincipal UUID userId,
                               @PathVariable UUID projectId, @PathVariable UUID sprintId) {
        projectService.requireMember(projectId, userId);
        return toResponse(sprintService.getById(sprintId));
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:view')")
    @GetMapping("/{sprintId}/burndown")
    public SprintService.BurndownData burndown(@AuthenticationPrincipal UUID userId,
                                               @PathVariable UUID projectId, @PathVariable UUID sprintId) {
        projectService.requireMember(projectId, userId);
        return sprintService.getBurndown(sprintId);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:manage')")
    @PostMapping
    public SprintResponse create(@AuthenticationPrincipal UUID userId,
                                  @PathVariable UUID projectId,
                                  @Valid @RequestBody CreateSprintRequest req) {
        projectService.requireMember(projectId, userId);
        Sprint sprint = sprintService.create(OrgContext.current(), projectId,
                req.name(), req.goal(), req.startDate(), req.endDate());
        return toResponse(sprint);
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:manage')")
    @PostMapping("/{sprintId}/start")
    public SprintResponse start(@AuthenticationPrincipal UUID userId,
                                 @PathVariable UUID projectId, @PathVariable UUID sprintId) {
        projectService.requireMember(projectId, userId);
        return toResponse(sprintService.start(OrgContext.current(), sprintId));
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:manage')")
    @PostMapping("/{sprintId}/complete")
    public SprintResponse complete(@AuthenticationPrincipal UUID userId,
                                    @PathVariable UUID projectId, @PathVariable UUID sprintId,
                                    @RequestBody CompleteSprintRequest req) {
        projectService.requireMember(projectId, userId);
        UUID moveToId = req.moveIncompleteToSprintId() == null ? null
                : UUID.fromString(req.moveIncompleteToSprintId());
        return toResponse(sprintService.complete(OrgContext.current(), sprintId, moveToId));
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:manage')")
    @PostMapping("/{sprintId}/issues")
    public void addIssue(@AuthenticationPrincipal UUID userId,
                          @PathVariable UUID projectId, @PathVariable UUID sprintId,
                          @RequestBody AddIssueRequest req) {
        projectService.requireMember(projectId, userId);
        sprintService.addIssue(sprintId, UUID.fromString(req.issueId()));
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('sprint:manage')")
    @DeleteMapping("/{sprintId}/issues/{issueId}")
    public void removeIssue(@AuthenticationPrincipal UUID userId,
                             @PathVariable UUID projectId, @PathVariable UUID sprintId,
                             @PathVariable UUID issueId) {
        projectService.requireMember(projectId, userId);
        sprintService.removeIssue(sprintId, issueId);
    }

    private SprintResponse toResponse(Sprint s) {
        return new SprintResponse(
                s.getId().toString(), s.getProjectId().toString(),
                s.getName(), s.getGoal(),
                s.getStartDate().toString(), s.getEndDate().toString(),
                s.getStatus().name(),
                s.getCreatedAt().toString(),
                s.getStartedAt() == null ? null : s.getStartedAt().toString(),
                s.getCompletedAt() == null ? null : s.getCompletedAt().toString());
    }
}
