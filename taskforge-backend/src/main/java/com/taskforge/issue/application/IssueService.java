package com.taskforge.issue.application;

import com.taskforge.activity.application.ActivityLogService;
import com.taskforge.aiagent.domain.AgentType;
import com.taskforge.aiagent.orchestration.events.IssueCreatedEvent;
import com.taskforge.aiagent.orchestration.events.IssueTransitionedEvent;
import com.taskforge.common.exception.ApiException;
import com.taskforge.identity.infrastructure.UserRepository;
import com.taskforge.issue.domain.Issue;
import com.taskforge.issue.domain.IssuePriority;
import com.taskforge.issue.domain.IssueType;
import com.taskforge.issue.infrastructure.IssueRepository;
import com.taskforge.notification.email.EmailService;
import com.taskforge.project.domain.Project;
import com.taskforge.project.domain.StatusCategory;
import com.taskforge.project.domain.WorkflowStatus;
import com.taskforge.project.infrastructure.ProjectRepository;
import com.taskforge.project.infrastructure.WorkflowStatusRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final WorkflowStatusRepository statusRepository;
    private final ApplicationEventPublisher events;
    private final ActivityLogService activityLogService;

    private final EmailService emailService;
    private final UserRepository userRepository;

    public IssueService(IssueRepository issueRepository, ProjectRepository projectRepository,
                         WorkflowStatusRepository statusRepository, ApplicationEventPublisher events,
                         ActivityLogService activityLogService, EmailService emailService, UserRepository userRepository) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.statusRepository = statusRepository;
        this.events = events;
        this.activityLogService = activityLogService;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @Transactional
    public Issue createIssue(UUID projectId, UUID reporterId, IssueType type, String title, String description,
                              IssuePriority priority, UUID epicId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));

        Issue issue = new Issue();
        issue.setProjectId(projectId);
        issue.setIssueKey(project.getKey() + "-" + project.nextIssueNumberAndIncrement());
        issue.setType(type);
        issue.setTitle(title);
        issue.setDescription(description);
        issue.setPriority(priority == null ? IssuePriority.MEDIUM : priority);
        issue.setEpicId(epicId);
        issue.setReporterId(reporterId);
        issue.setStatusId(defaultBacklogStatus(projectId).getId());

        projectRepository.save(project); // persist incremented next_issue_number
        issueRepository.save(issue);

        activityLogService.logHuman(projectId, issue.getId(), reporterId, "ISSUE_CREATED", null, null, issue.getTitle());
        events.publishEvent(new IssueCreatedEvent(issue.getId(), issue.getType().name()));
        return issue;
    }

    /** Used by AI agents (ArchitectAI) to create real sub-issues under an epic. */
    @Transactional
    public Issue createSubIssue(UUID parentIssueId, String title, String description, AgentType authorAgentType) {
        Issue parent = getById(parentIssueId);
        Project project = projectRepository.findById(parent.getProjectId())
                .orElseThrow(() -> ApiException.notFound("Project not found"));

        Issue issue = new Issue();
        issue.setProjectId(parent.getProjectId());
        issue.setIssueKey(project.getKey() + "-" + project.nextIssueNumberAndIncrement());
        issue.setType(IssueType.TASK);
        issue.setTitle(title);
        issue.setDescription(description);
        issue.setEpicId(parent.getType() == IssueType.EPIC ? parent.getId() : parent.getEpicId());
        issue.setReporterIsAi(true);
        issue.setReporterAiType(authorAgentType);
        issue.setStatusId(defaultBacklogStatus(parent.getProjectId()).getId());

        projectRepository.save(project);
        issueRepository.save(issue);

        activityLogService.logAi(issue.getProjectId(), issue.getId(), authorAgentType, "SUBISSUE_CREATED", issue.getTitle());
        events.publishEvent(new IssueCreatedEvent(issue.getId(), issue.getType().name()));
        return issue;
    }

    public Issue getById(UUID issueId) {
        return issueRepository.findById(issueId).orElseThrow(() -> ApiException.notFound("Issue not found"));
    }

    public List<Issue> listByProject(UUID projectId) {
        return issueRepository.findActiveByProject(projectId);
    }

    @Transactional
    public Issue updatePatch(UUID issueId, UUID actorId, String title, String description, IssuePriority priority,
                              UUID assigneeUserId, AgentType assigneeAiType, Integer storyPoints) {
        Issue issue = getById(issueId);
        if (title != null) issue.setTitle(title);
        if (description != null) issue.setDescription(description);
        if (priority != null) issue.setPriority(priority);
        if (storyPoints != null) issue.setStoryPoints(storyPoints);
        boolean assigningHuman = assigneeAiType == null && assigneeUserId != null
                && !assigneeUserId.equals(issue.getAssigneeId());
        if (assigneeAiType != null) {
            issue.setAssigneeIsAi(true);
            issue.setAssigneeAiType(assigneeAiType);
            issue.setAssigneeId(null);
        } else if (assigneeUserId != null) {
            issue.setAssigneeIsAi(false);
            issue.setAssigneeAiType(null);
            issue.setAssigneeId(assigneeUserId);
        }
        issue.touch();
        Issue saved = issueRepository.save(issue);

        // Real email notification — fails safe (see EmailService) so an unconfigured
        // or down mail server never blocks the assignment itself from succeeding.
        if (assigningHuman) {
            String assignedByName = userRepository.findById(actorId).map(com.taskforge.identity.domain.User::getFullName)
                    .orElse("A teammate");
            userRepository.findById(assigneeUserId).ifPresent(assignee ->
                    emailService.sendTaskAssigned(assignee.getEmail(), assignee.getFullName(),
                            saved.getIssueKey(), saved.getTitle(), assignedByName));
        }

        return saved;
    }

    @Transactional
    public Issue transition(UUID issueId, UUID newStatusId, UUID actorId) {
        Issue issue = getById(issueId);
        WorkflowStatus oldStatus = statusRepository.findById(issue.getStatusId()).orElse(null);
        WorkflowStatus status = statusRepository.findById(newStatusId)
                .orElseThrow(() -> ApiException.notFound("Status not found"));
        issue.setStatusId(status.getId());
        issue.touch();
        if (status.getCategory() == StatusCategory.DONE) {
            issue.setResolvedAt(java.time.Instant.now());
        }
        issueRepository.save(issue);

        activityLogService.logHuman(issue.getProjectId(), issue.getId(), actorId, "STATUS_CHANGED", "status",
                oldStatus == null ? null : oldStatus.getName(), status.getName());
        events.publishEvent(new IssueTransitionedEvent(issue.getId(), status.getCategory().name(), status.getName()));
        return issue;
    }

    private WorkflowStatus defaultBacklogStatus(UUID projectId) {
        return statusRepository.findByProjectIdOrderByPosition(projectId).stream()
                .min(Comparator.comparingInt(WorkflowStatus::getPosition))
                .orElseThrow(() -> ApiException.notFound("Project has no workflow statuses configured"));
    }
}
