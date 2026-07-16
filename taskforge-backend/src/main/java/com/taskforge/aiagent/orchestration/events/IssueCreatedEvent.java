package com.taskforge.aiagent.orchestration.events;

import java.util.UUID;

public record IssueCreatedEvent(UUID issueId, String issueType) {}
