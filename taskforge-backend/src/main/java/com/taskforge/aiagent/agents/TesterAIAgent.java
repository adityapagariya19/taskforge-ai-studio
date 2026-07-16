package com.taskforge.aiagent.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskforge.aiagent.domain.*;
import com.taskforge.aiagent.llm.LLMClient;
import org.springframework.stereotype.Component;

@Component
public class TesterAIAgent implements AIAgent {

    private static final String SYSTEM_PROMPT = """
        You are TesterAI, a QA engineer embedded in a project management tool.
        Given a completed or in-review piece of work, respond with JSON ONLY,
        no prose outside the JSON, matching exactly this shape:
        {
          "testScenarios": [
            {"title": "string", "description": "string", "category": "happy-path|edge-case|error-case"}
          ],
          "sampleTestCode": "string - one short, complete sample test (JUnit or Jest as fits the work), or an empty string"
        }
        Cover at least one happy-path, one edge-case, and one error-case scenario where applicable.
        """;

    private final LLMClient llmClient;
    private final ObjectMapper mapper = new ObjectMapper();

    public TesterAIAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
    }

    @Override
    public AgentType type() { return AgentType.TESTER_AI; }

    @Override
    public AgentResult execute(AgentContext context) {
        String userPrompt = """
            Issue title: %s
            Issue description: %s
            Recent comments (may include CodeAI's implementation to test): %s
            """.formatted(context.issueTitle(),
                emptyIfNull(context.issueDescription()), emptyIfNull(context.recentCommentsContext()));

        String raw;
        try {
            raw = llmClient.complete(SYSTEM_PROMPT, userPrompt);
        } catch (Exception e) {
            return AgentResult.failed(AgentType.TESTER_AI, e.getMessage());
        }

        try {
            JsonNode root = mapper.readTree(raw);
            StringBuilder comment = new StringBuilder("**TesterAI test scenarios**\n\n");
            if (root.has("testScenarios")) {
                for (JsonNode n : root.get("testScenarios")) {
                    comment.append("- **[").append(n.path("category").asText("case")).append("]** ")
                           .append(n.path("title").asText("")).append(" — ")
                           .append(n.path("description").asText("")).append("\n");
                }
            }
            String sample = root.path("sampleTestCode").asText("");
            if (!sample.isBlank()) {
                comment.append("\nSample test:\n```\n").append(sample).append("\n```\n");
            }
            return AgentResult.commentOnly(AgentType.TESTER_AI, comment.toString(), raw, "configured-model");
        } catch (Exception e) {
            return AgentResult.commentOnly(AgentType.TESTER_AI,
                    "**TesterAI** could not parse a structured response and will retry automatically.",
                    raw, "configured-model");
        }
    }

    private static String emptyIfNull(String s) { return s == null ? "" : s; }
}
