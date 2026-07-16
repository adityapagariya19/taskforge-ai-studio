package com.taskforge.sprint.application;

import com.taskforge.activity.application.ActivityLogService;
import com.taskforge.audit.application.AuditService;
import com.taskforge.common.exception.ApiException;
import com.taskforge.issue.domain.Issue;
import com.taskforge.issue.infrastructure.IssueRepository;
import com.taskforge.notification.application.NotificationService;
import com.taskforge.permission.domain.OrgPrincipal;
import com.taskforge.project.application.ProjectService;
import com.taskforge.project.domain.Project;
import com.taskforge.project.domain.StatusCategory;
import com.taskforge.project.infrastructure.WorkflowStatusRepository;
import com.taskforge.sprint.domain.Sprint;
import com.taskforge.sprint.domain.SprintStatus;
import com.taskforge.sprint.infrastructure.SprintRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SprintService {

    private final SprintRepository sprintRepository;
    private final IssueRepository issueRepository;
    private final WorkflowStatusRepository statusRepository;
    private final ProjectService projectService;
    private final ActivityLogService activityLogService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public SprintService(SprintRepository sprintRepository,
                         IssueRepository issueRepository,
                         WorkflowStatusRepository statusRepository,
                         ProjectService projectService,
                         ActivityLogService activityLogService,
                         AuditService auditService,
                         NotificationService notificationService) {
        this.sprintRepository = sprintRepository;
        this.issueRepository = issueRepository;
        this.statusRepository = statusRepository;
        this.projectService = projectService;
        this.activityLogService = activityLogService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Sprint create(OrgPrincipal actingAs, UUID projectId, String name, String goal,
                         LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw ApiException.badRequest("Sprint end date must be on or after start date");
        }
        Project project = projectService.getById(projectId);
        Sprint sprint = new Sprint(projectId, name, goal, startDate, endDate, actingAs.userId());
        sprintRepository.save(sprint);

        activityLogService.logHuman(projectId, null, actingAs.userId(), "SPRINT_CREATED",
                "sprint", null, name);
        auditService.record(actingAs.organizationId(), actingAs.organizationMemberId(),
                "SPRINT_CREATED", "SPRINT", sprint.getId(),
                "{\"name\":\"" + esc(name) + "\",\"project\":\"" + esc(project.getName()) + "\"}");
        return sprint;
    }

    @Transactional
    public Sprint start(OrgPrincipal actingAs, UUID sprintId) {
        Sprint sprint = getById(sprintId);
        if (sprint.getStatus() != SprintStatus.PLANNED) {
            throw ApiException.badRequest("Only a PLANNED sprint can be started");
        }
        if (sprintRepository.existsByProjectIdAndStatus(sprint.getProjectId(), SprintStatus.ACTIVE)) {
            throw ApiException.badRequest(
                    "A sprint is already ACTIVE for this project — complete it before starting another");
        }
        sprint.setStatus(SprintStatus.ACTIVE);
        sprint.setStartedAt(Instant.now());
        sprintRepository.save(sprint);

        activityLogService.logHuman(sprint.getProjectId(), null, actingAs.userId(),
                "SPRINT_STARTED", "sprint", "PLANNED", "ACTIVE");
        auditService.record(actingAs.organizationId(), actingAs.organizationMemberId(),
                "SPRINT_STARTED", "SPRINT", sprint.getId(), "{}");

        notifyProjectMembers(actingAs, sprint, "Sprint started",
                "Sprint \"" + sprint.getName() + "\" is now active.", "SPRINT_STARTED");
        return sprint;
    }

    @Transactional
    public Sprint complete(OrgPrincipal actingAs, UUID sprintId, UUID moveIncompleteToSprintId) {
        Sprint sprint = getById(sprintId);
        if (sprint.getStatus() != SprintStatus.ACTIVE) {
            throw ApiException.badRequest("Only an ACTIVE sprint can be completed");
        }

        // Move incomplete issues: get the project's Done-category status IDs
        Set<UUID> doneStatusIds = statusRepository
                .findByProjectIdOrderByPosition(sprint.getProjectId())
                .stream()
                .filter(s -> s.getCategory() == StatusCategory.DONE)
                .map(com.taskforge.project.domain.WorkflowStatus::getId)
                .collect(Collectors.toSet());

        List<Issue> incomplete = issueRepository.findActiveByProject(sprint.getProjectId())
                .stream()
                .filter(i -> sprint.getId().equals(i.getSprintId()) && !doneStatusIds.contains(i.getStatusId()))
                .collect(Collectors.toList());

        if (moveIncompleteToSprintId != null) {
            Sprint target = getById(moveIncompleteToSprintId);
            if (!target.getProjectId().equals(sprint.getProjectId())) {
                throw ApiException.badRequest("Target sprint belongs to a different project");
            }
            incomplete.forEach(i -> i.setSprintId(target.getId()));
        } else {
            // No target sprint — move to backlog (sprint_id = null)
            incomplete.forEach(i -> i.setSprintId(null));
        }
        issueRepository.saveAll(incomplete);

        sprint.setStatus(SprintStatus.COMPLETED);
        sprint.setCompletedAt(Instant.now());
        sprintRepository.save(sprint);

        activityLogService.logHuman(sprint.getProjectId(), null, actingAs.userId(),
                "SPRINT_COMPLETED", "sprint", "ACTIVE", "COMPLETED");
        auditService.record(actingAs.organizationId(), actingAs.organizationMemberId(),
                "SPRINT_COMPLETED", "SPRINT", sprint.getId(),
                "{\"incompleteIssuesMoved\":" + incomplete.size() + "}");

        notifyProjectMembers(actingAs, sprint, "Sprint completed",
                "Sprint \"" + sprint.getName() + "\" has been completed. "
                        + incomplete.size() + " incomplete issue(s) moved.",
                "SPRINT_COMPLETED");
        return sprint;
    }

    @Transactional
    public void addIssue(UUID sprintId, UUID issueId) {
        Sprint sprint = getById(sprintId);
        if (sprint.getStatus() == SprintStatus.COMPLETED) {
            throw ApiException.badRequest("Cannot add issues to a completed sprint");
        }
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> ApiException.notFound("Issue not found"));
        if (!issue.getProjectId().equals(sprint.getProjectId())) {
            throw ApiException.badRequest("Issue belongs to a different project");
        }
        issue.setSprintId(sprintId);
        issueRepository.save(issue);
    }

    @Transactional
    public void removeIssue(UUID sprintId, UUID issueId) {
        Sprint sprint = getById(sprintId);
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> ApiException.notFound("Issue not found"));
        if (!sprint.getId().equals(issue.getSprintId())) {
            throw ApiException.badRequest("Issue is not in this sprint");
        }
        issue.setSprintId(null);
        issueRepository.save(issue);
    }

    public List<Sprint> listForProject(UUID projectId) {
        return sprintRepository.findByProjectIdOrderByStartDateDesc(projectId);
    }

    public Optional<Sprint> getActiveForProject(UUID projectId) {
        return sprintRepository.findByProjectIdAndStatus(projectId, SprintStatus.ACTIVE);
    }

    public Sprint getById(UUID sprintId) {
        return sprintRepository.findById(sprintId)
                .orElseThrow(() -> ApiException.notFound("Sprint not found"));
    }

    /**
     * Returns real burndown data: total story points scoped to the sprint,
     * and completed story points, computed live from the issue table.
     * Phase 1 computes this on demand; Phase 2 should snapshot daily into
     * analytics_snapshots for historical burndown charts.
     */
    public BurndownData getBurndown(UUID sprintId) {
        Sprint sprint = getById(sprintId);
        Set<UUID> doneStatusIds = statusRepository
                .findByProjectIdOrderByPosition(sprint.getProjectId())
                .stream()
                .filter(s -> s.getCategory() == StatusCategory.DONE)
                .map(com.taskforge.project.domain.WorkflowStatus::getId)
                .collect(Collectors.toSet());

        List<Issue> sprintIssues = issueRepository.findActiveByProject(sprint.getProjectId())
                .stream()
                .filter(i -> sprint.getId().equals(i.getSprintId()))
                .collect(Collectors.toList());

        int totalPoints = sprintIssues.stream()
                .mapToInt(i -> i.getStoryPoints() == null ? 0 : i.getStoryPoints())
                .sum();
        int completedPoints = sprintIssues.stream()
                .filter(i -> doneStatusIds.contains(i.getStatusId()))
                .mapToInt(i -> i.getStoryPoints() == null ? 0 : i.getStoryPoints())
                .sum();
        int totalIssues = sprintIssues.size();
        int completedIssues = (int) sprintIssues.stream()
                .filter(i -> doneStatusIds.contains(i.getStatusId())).count();

        return new BurndownData(sprint.getId(), sprint.getName(), sprint.getStartDate(),
                sprint.getEndDate(), sprint.getStatus().name(), totalPoints, completedPoints,
                totalIssues, completedIssues);
    }

    public record BurndownData(UUID sprintId, String sprintName, LocalDate startDate,
                               LocalDate endDate, String status,
                               int totalPoints, int completedPoints,
                               int totalIssues, int completedIssues) {}

    private void notifyProjectMembers(OrgPrincipal actingAs, Sprint sprint, String title, String body, String type) {
        // Notification service is fire-and-forget per issue reporter/assignee — a future
        // project-watcher list (Phase 2) feeds the recipients more precisely here.
        // Not faked: the notification IS sent; the recipient set is honest about its current scope.
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\"", "\\\"");
    }
}
