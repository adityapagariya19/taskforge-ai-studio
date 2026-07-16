package com.taskforge.aiagent.domain;

public interface AIAgent {
    AgentType type();
    AgentResult execute(AgentContext context);
}
