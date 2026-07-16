package com.taskforge.aiagent.infrastructure;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_generated_files")
@Getter
@Setter
@NoArgsConstructor
public class AIGeneratedFile {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "execution_id", nullable = false)
    private UUID executionId;

    @Column(nullable = false)
    private String filename;

    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AIGeneratedFile(UUID executionId, String filename, String language, String content) {
        this.executionId = executionId;
        this.filename = filename;
        this.language = language;
        this.content = content;
    }
}
