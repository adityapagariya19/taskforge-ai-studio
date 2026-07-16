package com.taskforge.issue.domain;

import com.taskforge.aiagent.domain.AgentType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "issues")
@Getter
@Setter
@NoArgsConstructor
public class Issue {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "issue_key", nullable = false)
    private String issueKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueType type;

    @Column(name = "parent_issue_id")
    private UUID parentIssueId;

    @Column(name = "epic_id")
    private UUID epicId;

    @Column(name = "sprint_id")
    private UUID sprintId;

    @Column(name = "status_id", nullable = false)
    private UUID statusId;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssuePriority priority = IssuePriority.MEDIUM;

    @Column(name = "story_points")
    private Integer storyPoints;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @Column(name = "assignee_is_ai", nullable = false)
    private boolean assigneeIsAi = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignee_ai_type")
    private AgentType assigneeAiType;

    @Column(name = "reporter_id")
    private UUID reporterId;

    @Column(name = "reporter_is_ai", nullable = false)
    private boolean reporterIsAi = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "reporter_ai_type")
    private AgentType reporterAiType;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "board_position", nullable = false)
    private int boardPosition = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public void touch() { this.updatedAt = Instant.now(); }
}
