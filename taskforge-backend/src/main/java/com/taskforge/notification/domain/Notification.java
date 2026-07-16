package com.taskforge.notification.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    private String link;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_is_ai", nullable = false)
    private boolean actorIsAi = false;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Notification(UUID userId, String type, String title, String body, String link, boolean actorIsAi) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.body = body;
        this.link = link;
        this.actorIsAi = actorIsAi;
    }
}
