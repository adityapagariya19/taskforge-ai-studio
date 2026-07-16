package com.taskforge.project.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class Project {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false)
    private String key;

    @Column(nullable = false)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectType type = ProjectType.KANBAN;

    @Column(name = "next_issue_number", nullable = false)
    private int nextIssueNumber = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "archived_at")
    private Instant archivedAt;

    public Project(UUID workspaceId, String key, String name, String description, ProjectType type) {
        this.workspaceId = workspaceId;
        this.key = key;
        this.name = name;
        this.description = description;
        this.type = type;
    }

    /** Atomically hands out the next human-readable issue number, e.g. for TF-101. */
    public int nextIssueNumberAndIncrement() {
        int current = this.nextIssueNumber;
        this.nextIssueNumber = current + 1;
        return current;
    }
}
