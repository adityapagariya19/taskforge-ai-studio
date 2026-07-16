package com.taskforge.aiagent.domain;

import java.util.UUID;

/**
 * Everything an agent needs to act on a single issue. Deliberately small and
 * explicit (no raw entity objects) so agents stay decoupled from JPA.
 */
public record AgentContext(
        UUID issueId,
        String issueKey,
        String issueType,
        String issueTitle,
        String issueDescription,
        AgentTrigger trigger,
        String recentCommentsContext, // last few comments concatenated, may be empty
        String instructions // explicit human instruction-box content for this run, may be null
) {}
