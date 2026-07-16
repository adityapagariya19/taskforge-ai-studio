package com.taskforge.collaboration.application;

import com.taskforge.activity.application.ActivityLogService;
import com.taskforge.aiagent.domain.AgentType;
import com.taskforge.collaboration.domain.Comment;
import com.taskforge.collaboration.infrastructure.CommentRepository;
import com.taskforge.issue.application.IssueService;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final ActivityLogService activityLogService;
    private final IssueService issueService;

    public CommentService(CommentRepository commentRepository, ActivityLogService activityLogService, IssueService issueService) {
        this.commentRepository = commentRepository;
        this.activityLogService = activityLogService;
        this.issueService = issueService;
    }

    public Comment addHumanComment(UUID issueId, UUID authorId, String body) {
        Comment saved = commentRepository.save(Comment.byHuman(issueId, authorId, body));
        var issue = issueService.getById(issueId);
        activityLogService.logHuman(issue.getProjectId(), issueId, authorId, "COMMENT_ADDED", null, null, truncate(body));
        return saved;
    }

    public Comment addAiComment(UUID issueId, AgentType agentType, String body) {
        Comment saved = commentRepository.save(Comment.byAi(issueId, agentType, body));
        var issue = issueService.getById(issueId);
        activityLogService.logAi(issue.getProjectId(), issueId, agentType, "COMMENT_ADDED", truncate(body));
        return saved;
    }

    private String truncate(String s) {
        return s == null ? null : (s.length() > 200 ? s.substring(0, 200) + "..." : s);
    }

    public List<Comment> listByIssue(UUID issueId) {
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId);
    }

    /** Concatenates the most recent comments into a short text block for AI agent context. */
    public String getRecentCommentsText(UUID issueId) {
        List<Comment> recent = commentRepository.findTop5ByIssueIdOrderByCreatedAtDesc(issueId);
        return recent.stream()
                .sorted(Comparator.comparing(Comment::getCreatedAt))
                .map(c -> (c.isAuthorIsAi() ? c.getAuthorAiType().name() : "human") + ": " + c.getBody())
                .collect(Collectors.joining("\n---\n"));
    }
}
