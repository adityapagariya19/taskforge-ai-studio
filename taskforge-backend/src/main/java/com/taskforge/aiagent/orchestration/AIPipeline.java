package com.taskforge.aiagent.orchestration;

import com.taskforge.aiagent.domain.AgentType;

import java.util.Map;
import java.util.Optional;

/**
 * The real, explicit engineering pipeline: when a human approves one agent's
 * output, this is what determines which agent runs next. ArchitectAI and
 * ProjectManagerAI are entry points (triggered by issue creation, not by
 * approval) and are not part of this linear chain — CODE_AI through
 * DOCUMENTATION_AI is the approval-gated implementation pipeline the person
 * actually asked for: deliver → review → satisfied? → next phase.
 */
public final class AIPipeline {

    private static final Map<AgentType, AgentType> NEXT = Map.of(
            AgentType.CODE_AI, AgentType.REVIEWER_AI,
            AgentType.REVIEWER_AI, AgentType.TESTER_AI,
            AgentType.TESTER_AI, AgentType.DOCUMENTATION_AI
    );

    private AIPipeline() {}

    public static Optional<AgentType> next(AgentType current) {
        return Optional.ofNullable(NEXT.get(current));
    }

    /** Whether this agent's output should be gated behind human approval before the pipeline advances. */
    public static boolean requiresApproval(AgentType type) {
        return NEXT.containsKey(type);
    }
}
