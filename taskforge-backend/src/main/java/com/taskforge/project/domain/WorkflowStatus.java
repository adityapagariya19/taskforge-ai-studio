package com.taskforge.project.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "workflow_statuses")
@Getter
@Setter
@NoArgsConstructor
public class WorkflowStatus {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusCategory category;

    @Column(nullable = false)
    private int position;

    private String color;

    public WorkflowStatus(UUID projectId, String name, StatusCategory category, int position, String color) {
        this.projectId = projectId;
        this.name = name;
        this.category = category;
        this.position = position;
        this.color = color;
    }
}
