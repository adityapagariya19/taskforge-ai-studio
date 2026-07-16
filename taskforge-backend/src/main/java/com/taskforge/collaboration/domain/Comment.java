package com.taskforge.collaboration.domain;

import com.taskforge.aiagent.domain.AgentType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
public class Comment {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "issue_id", nullable = false)
    private UUID issueId;

    @Column(name = "author_id")
    private UUID authorId;

    @Column(name = "author_is_ai", nullable = false)
    private boolean authorIsAi = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "author_ai_type")
    private AgentType authorAiType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    public static Comment byHuman(UUID issueId, UUID authorId, String body) {
        Comment c = new Comment();
        c.issueId = issueId;
        c.authorId = authorId;
        c.body = body;
        return c;
    }

    public static Comment byAi(UUID issueId, AgentType agentType, String body) {
        Comment c = new Comment();
        c.issueId = issueId;
        c.authorIsAi = true;
        c.authorAiType = agentType;
        c.body = body;
        return c;
    }
}
