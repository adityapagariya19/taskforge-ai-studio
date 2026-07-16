package com.taskforge.aiagent.orchestration.events;

import java.util.UUID;

/**
 * Fired whenever an issue's status changes. statusCategory is one of TODO/IN_PROGRESS/DONE
 * (see com.taskforge.project.domain.StatusCategory) — kept as a String here so the aiagent
 * module doesn't need a hard dependency on the project module's enum type.
 */
public record IssueTransitionedEvent(UUID issueId, String newStatusCategory, String newStatusName) {}
