package com.taskforge.aiagent.orchestration;

import com.taskforge.aiagent.domain.AIAgent;
import com.taskforge.aiagent.domain.AgentContext;
import com.taskforge.aiagent.domain.AgentResult;
import com.taskforge.aiagent.domain.AgentTrigger;
import com.taskforge.aiagent.domain.AgentType;
import com.taskforge.aiagent.infrastructure.AIAgentExecutionEntity;
import com.taskforge.aiagent.infrastructure.AIAgentExecutionRepository;
import com.taskforge.aiagent.infrastructure.AIGeneratedFile;
import com.taskforge.aiagent.infrastructure.AIGeneratedFileRepository;
import com.taskforge.aiagent.infrastructure.AITaskQueueEntity;
import com.taskforge.aiagent.infrastructure.AITaskQueueRepository;
import com.taskforge.collaboration.application.CommentService;
import com.taskforge.issue.application.IssueService;
import com.taskforge.issue.domain.Issue;
import com.taskforge.notification.application.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * The loop that makes AI teammates actually "do tasks by themselves": polls
 * ai_task_queue, runs the right agent through the exact same IssueService /
 * CommentService methods a human action would use, persists structured
 * output (including real files, not just markdown text), and — for
 * pipeline agents — leaves the execution in PENDING_REVIEW rather than
 * silently chaining to the next agent. The chain only advances when a human
 * explicitly approves via AIApprovalService.
 */
@Component
public class AITaskQueueWorker {

    private final AITaskQueueRepository queueRepository;
    private final AIAgentExecutionRepository executionRepository;
    private final AIGeneratedFileRepository generatedFileRepository;
    private final IssueService issueService;
    private final CommentService commentService;
    private final NotificationService notificationService;
    private final Map<AgentType, AIAgent> agentsByType;

    public AITaskQueueWorker(AITaskQueueRepository queueRepository, AIAgentExecutionRepository executionRepository,
                              AIGeneratedFileRepository generatedFileRepository, IssueService issueService,
                              CommentService commentService, NotificationService notificationService,
                              List<AIAgent> agents) {
        this.queueRepository = queueRepository;
        this.executionRepository = executionRepository;
        this.generatedFileRepository = generatedFileRepository;
        this.issueService = issueService;
        this.commentService = commentService;
        this.notificationService = notificationService;
        this.agentsByType = agents.stream().collect(Collectors.toMap(AIAgent::type, a -> a));
    }

    @Scheduled(fixedDelay = 5000)
    public void processQueue() {
        for (AITaskQueueEntity task : queueRepository.findTop10ByStatusOrderByEnqueuedAtAsc(AITaskQueueEntity.QUEUED)) {
            runOne(task);
        }
    }

    public void runOne(AITaskQueueEntity task) {
        task.markProcessing();
        queueRepository.save(task);

        Issue issue = issueService.getById(task.getIssueId());
        AIAgentExecutionEntity execution = AIAgentExecutionEntity.start(
                issue.getId(), task.getAgentType(), task.getTriggerEvent(), task.getInstructions());
        executionRepository.save(execution);

        try {
            AIAgent agent = agentsByType.get(task.getAgentType());
            if (agent == null) {
                throw new IllegalStateException("No AIAgent bean registered for " + task.getAgentType());
            }

            AgentContext context = new AgentContext(
                    issue.getId(),
                    issue.getIssueKey(),
                    issue.getType().name(),
                    issue.getTitle(),
                    issue.getDescription(),
                    AgentTrigger.valueOf(mapTrigger(task.getTriggerEvent())),
                    commentService.getRecentCommentsText(issue.getId()),
                    task.getInstructions()
            );

            AgentResult result = agent.execute(context);

            if (!result.success()) {
                throw new IllegalStateException(result.rawModelOutput());
            }

            // Same application services a human action would call — no special AI backdoor.
            for (AgentResult.SubIssueDraft draft : result.subIssues()) {
                issueService.createSubIssue(issue.getId(), draft.title(), draft.description(), task.getAgentType());
            }
            if (result.commentMarkdown() != null && !result.commentMarkdown().isBlank()) {
                commentService.addAiComment(issue.getId(), task.getAgentType(), result.commentMarkdown());
            }

            // Persist generated files structurally — this is what makes real zip download possible,
            // not just markdown code fences the person has to copy out by hand.
            for (AgentResult.GeneratedFile file : result.files()) {
                generatedFileRepository.save(new AIGeneratedFile(
                        execution.getId(), file.filename(), file.language(), file.content()));
            }

            boolean needsApproval = AIPipeline.requiresApproval(task.getAgentType());
            execution.complete(summarize(result), result.modelUsed(), needsApproval);
            executionRepository.save(execution);

            notifyStakeholders(issue, task.getAgentType(), needsApproval);
            task.markDone();
        } catch (Exception e) {
            execution.fail(e.getMessage());
            executionRepository.save(execution);
            task.markFailedAndMaybeRetry();
        }
        queueRepository.save(task);
    }

    private void notifyStakeholders(Issue issue, AgentType agentType, boolean needsApproval) {
        String title = needsApproval
                ? agentType.name() + " is awaiting your review on " + issue.getIssueKey()
                : agentType.name() + " acted on " + issue.getIssueKey();
        String body = needsApproval
                ? "Review the output and approve to continue the pipeline."
                : agentType.name() + " updated " + issue.getIssueKey();

        if (!issue.isReporterIsAi() && issue.getReporterId() != null) {
            notificationService.notify(issue.getReporterId(), "AI_AGENT_ACTIVITY", title, body,
                    "/issues/" + issue.getId(), true);
        }
        if (!issue.isAssigneeIsAi() && issue.getAssigneeId() != null) {
            notificationService.notify(issue.getAssigneeId(), "AI_AGENT_ACTIVITY", title, body,
                    "/issues/" + issue.getId(), true);
        }
    }

    private String summarize(AgentResult result) {
        return "subIssuesCreated=" + result.subIssues().size()
                + "; commentPosted=" + (result.commentMarkdown() != null)
                + "; filesGenerated=" + result.files().size();
    }

    private String mapTrigger(String triggerEvent) {
        return switch (triggerEvent) {
            case "ISSUE_CREATED" -> "ISSUE_CREATED";
            case "ISSUE_MOVED_TO_IN_PROGRESS" -> "ISSUE_MOVED_TO_IN_PROGRESS";
            case "ISSUE_MOVED_TO_IN_REVIEW" -> "ISSUE_MOVED_TO_IN_REVIEW";
            case "ISSUE_MOVED_TO_DONE" -> "ISSUE_MOVED_TO_DONE";
            default -> "MANUAL_INVOKE";
        };
    }
}
