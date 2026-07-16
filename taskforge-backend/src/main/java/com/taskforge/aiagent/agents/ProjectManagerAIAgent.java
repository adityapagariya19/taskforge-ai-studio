package com.taskforge.aiagent.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskforge.aiagent.domain.*;
import com.taskforge.aiagent.llm.LLMClient;
import org.springframework.stereotype.Component;

@Component
public class ProjectManagerAIAgent implements AIAgent {

    private static final String SYSTEM_PROMPT = """
        You are ProjectManagerAI, embedded in a project management tool. Given a
        new or in-progress issue, assess its priority and any delay/scope risk.
        Respond with JSON ONLY, no prose outside the JSON:
        {
          "recommendedPriority": "LOWEST|LOW|MEDIUM|HIGH|HIGHEST",
          "riskNote": "string - one sentence flagging any risk, or empty string if none",
          "rationale": "string - one or two sentences explaining the recommendation"
        }
        """;

    private final LLMClient llmClient;
    private final ObjectMapper mapper = new ObjectMapper();

    public ProjectManagerAIAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
    }

    @Override
    public AgentType type() { return AgentType.PROJECT_MANAGER_AI; }

    @Override
    public AgentResult execute(AgentContext context) {
        String userPrompt = """
            Issue type: %s
            Issue title: %s
            Issue description: %s
            """.formatted(context.issueType(), context.issueTitle(), emptyIfNull(context.issueDescription()));

        String raw;
        try {
            raw = llmClient.complete(SYSTEM_PROMPT, userPrompt);
        } catch (Exception e) {
            return AgentResult.failed(AgentType.PROJECT_MANAGER_AI, e.getMessage());
        }

        try {
            JsonNode root = mapper.readTree(raw);
            String priority = root.path("recommendedPriority").asText("MEDIUM");
            String risk = root.path("riskNote").asText("");
            String rationale = root.path("rationale").asText("");

            StringBuilder comment = new StringBuilder("**ProjectManagerAI**\n\n")
                    .append("Recommended priority: **").append(priority).append("**\n\n")
                    .append(rationale);
            if (!risk.isBlank()) comment.append("\n\n⚠ Risk: ").append(risk);

            return AgentResult.commentOnly(AgentType.PROJECT_MANAGER_AI, comment.toString(), raw, "configured-model");
        } catch (Exception e) {
            return AgentResult.commentOnly(AgentType.PROJECT_MANAGER_AI,
                    "**ProjectManagerAI** could not parse a structured response and will retry automatically.",
                    raw, "configured-model");
        }
    }

    private static String emptyIfNull(String s) { return s == null ? "" : s; }
}
