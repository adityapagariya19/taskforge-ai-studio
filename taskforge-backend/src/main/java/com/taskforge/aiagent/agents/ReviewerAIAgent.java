package com.taskforge.aiagent.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskforge.aiagent.domain.*;
import com.taskforge.aiagent.llm.LLMClient;
import org.springframework.stereotype.Component;

@Component
public class ReviewerAIAgent implements AIAgent {

    private static final String SYSTEM_PROMPT = """
        You are ReviewerAI, a senior engineer doing code/design review inside a
        project management tool. Respond with JSON ONLY, no prose outside the
        JSON, matching exactly this shape:
        {
          "risks": ["string"],
          "suggestions": ["string"],
          "overallAssessment": "string - one or two sentences"
        }
        Be specific and concrete; avoid generic advice like "add more tests" unless
        you can say which scenario is missing.
        """;

    private final LLMClient llmClient;
    private final ObjectMapper mapper = new ObjectMapper();

    public ReviewerAIAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
    }

    @Override
    public AgentType type() { return AgentType.REVIEWER_AI; }

    @Override
    public AgentResult execute(AgentContext context) {
        String userPrompt = """
            Issue title: %s
            Issue description: %s
            Work to review (recent comments, e.g. CodeAI's implementation): %s
            """.formatted(context.issueTitle(),
                emptyIfNull(context.issueDescription()), emptyIfNull(context.recentCommentsContext()));

        String raw;
        try {
            raw = llmClient.complete(SYSTEM_PROMPT, userPrompt);
        } catch (Exception e) {
            return AgentResult.failed(AgentType.REVIEWER_AI, e.getMessage());
        }

        try {
            JsonNode root = mapper.readTree(raw);
            StringBuilder comment = new StringBuilder("**ReviewerAI**\n\n");
            comment.append(root.path("overallAssessment").asText("")).append("\n\n");
            if (root.has("risks") && root.get("risks").size() > 0) {
                comment.append("**Risks:**\n");
                for (JsonNode n : root.get("risks")) comment.append("- ").append(n.asText()).append("\n");
            }
            if (root.has("suggestions") && root.get("suggestions").size() > 0) {
                comment.append("\n**Suggestions:**\n");
                for (JsonNode n : root.get("suggestions")) comment.append("- ").append(n.asText()).append("\n");
            }
            return AgentResult.commentOnly(AgentType.REVIEWER_AI, comment.toString(), raw, "configured-model");
        } catch (Exception e) {
            return AgentResult.commentOnly(AgentType.REVIEWER_AI,
                    "**ReviewerAI** could not parse a structured response and will retry automatically.",
                    raw, "configured-model");
        }
    }

    private static String emptyIfNull(String s) { return s == null ? "" : s; }
}
