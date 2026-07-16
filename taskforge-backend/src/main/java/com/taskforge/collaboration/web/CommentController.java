package com.taskforge.collaboration.web;

import com.taskforge.collaboration.application.CommentService;
import com.taskforge.collaboration.domain.Comment;
import com.taskforge.issue.application.IssueService;
import com.taskforge.project.application.ProjectService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/issues/{issueId}/comments")
public class CommentController {

    private final CommentService commentService;
    private final IssueService issueService;
    private final ProjectService projectService;

    public CommentController(CommentService commentService, IssueService issueService, ProjectService projectService) {
        this.commentService = commentService;
        this.issueService = issueService;
        this.projectService = projectService;
    }

    public record CreateCommentRequest(String body) {}
    public record CommentResponse(String id, String authorId, boolean authorIsAi, String authorAiType,
                                   String body, String createdAt) {}

    @PreAuthorize("@permissionEvaluator.hasPermission('issue:view')")
    @GetMapping
    public List<CommentResponse> list(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId) {
        var issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);
        return commentService.listByIssue(issueId).stream().map(this::toResponse).toList();
    }

    @PreAuthorize("@permissionEvaluator.hasPermission('comment:create')")
    @PostMapping
    public CommentResponse create(@AuthenticationPrincipal UUID userId, @PathVariable UUID issueId,
                                   @RequestBody CreateCommentRequest req) {
        var issue = issueService.getById(issueId);
        projectService.requireMember(issue.getProjectId(), userId);
        Comment comment = commentService.addHumanComment(issueId, userId, req.body());
        return toResponse(comment);
    }

    private CommentResponse toResponse(Comment c) {
        return new CommentResponse(c.getId().toString(), c.getAuthorId() == null ? null : c.getAuthorId().toString(),
                c.isAuthorIsAi(), c.getAuthorAiType() == null ? null : c.getAuthorAiType().name(),
                c.getBody(), c.getCreatedAt().toString());
    }
}
