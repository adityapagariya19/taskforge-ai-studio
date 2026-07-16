package com.taskforge.aiagent.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskforge.aiagent.domain.*;
import com.taskforge.aiagent.llm.LLMClient;
import org.springframework.stereotype.Component;

@Component
public class DocumentationAIAgent implements AIAgent {

    private static final String SYSTEM_PROMPT = """
        You are DocumentationAI, embedded in a project management tool. Given a
        completed issue, write a short technical document summarizing what was
        built and why. Respond with JSON ONLY, no prose outside the JSON:
        {"documentationMarkdown": "string - a short markdown technical document, 150-300 words"}
        """;

    private final LLMClient llmClient;
    private final ObjectMapper mapper = new ObjectMapper();

    public DocumentationAIAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
    }

    @Override
    public AgentType type() { return AgentType.DOCUMENTATION_AI; }

    @Override
    public AgentResult execute(AgentContext context) {
        String userPrompt = """
            Completed issue title: %s
            Description: %s
            Implementation/review history (recent comments): %s
            """.formatted(context.issueTitle(),
                emptyIfNull(context.issueDescription()), emptyIfNull(context.recentCommentsContext()));

        String raw;
        try {
            raw = llmClient.complete(SYSTEM_PROMPT, userPrompt);
        } catch (Exception e) {
            return AgentResult.failed(AgentType.DOCUMENTATION_AI, e.getMessage());
        }

        try {
            JsonNode root = mapper.readTree(raw);
            String doc = root.path("documentationMarkdown").asText("");
            return AgentResult.commentOnly(AgentType.DOCUMENTATION_AI, "**DocumentationAI**\n\n" + doc, raw, "configured-model");
        } catch (Exception e) {
            return AgentResult.commentOnly(AgentType.DOCUMENTATION_AI,
                    "**DocumentationAI** could not parse a structured response and will retry automatically.",
                    raw, "configured-model");
        }
    }

    private static String emptyIfNull(String s) { return s == null ? "" : s; }
}
