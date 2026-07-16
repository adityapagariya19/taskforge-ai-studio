package com.taskforge.aiagent.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskforge.aiagent.domain.*;
import com.taskforge.aiagent.llm.LLMClient;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Breaks epics/features into subtasks, proposes architecture, and — when the
 * issue is asking for a "sketch"/diagram of a system or website — returns a
 * real Mermaid.js diagram (a text-based, renderable sketch) rather than a
 * raster image. Local text LLMs like Llama/Mistral can't draw pictures; a
 * Mermaid diagram is the honest, actually-working equivalent.
 */
@Component
public class ArchitectAIAgent implements AIAgent {

    private static final String SYSTEM_PROMPT = """
        You are ArchitectAI, a senior software architect embedded in a project
        management tool. You are given a single issue (an epic, a feature request,
        or a request for an architecture/website sketch). Respond with JSON ONLY,
        no prose outside the JSON, matching exactly this shape:
        {
          "subtasks": [{"title": "string", "description": "string"}],
          "architectureNotes": "string - clear written explanation of the proposed architecture or approach",
          "mermaidDiagram": "string - valid Mermaid.js 'graph' or 'flowchart' syntax sketching the architecture, system, or page flow being requested. Use an empty string if a diagram would not help here."
        }
        Propose 0 subtasks if the issue is only asking for an explanation or a diagram.
        Propose 3 to 7 concrete, actionable subtasks if the issue is an epic or feature
        that should be broken down into engineering work.
        """;

    private final LLMClient llmClient;
    private final ObjectMapper mapper = new ObjectMapper();
    private final String modelName;

    public ArchitectAIAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
        this.modelName = "configured-model";
    }

    @Override
    public AgentType type() { return AgentType.ARCHITECT_AI; }

    @Override
    public AgentResult execute(AgentContext context) {
        String userPrompt = """
            Issue type: %s
            Issue title: %s
            Issue description: %s
            Recent comments: %s
            """.formatted(context.issueType(), context.issueTitle(),
                emptyIfNull(context.issueDescription()), emptyIfNull(context.recentCommentsContext()));

        String raw;
        try {
            raw = llmClient.complete(SYSTEM_PROMPT, userPrompt);
        } catch (Exception e) {
            return AgentResult.failed(AgentType.ARCHITECT_AI, e.getMessage());
        }

        try {
            JsonNode root = mapper.readTree(raw);
            List<AgentResult.SubIssueDraft> subtasks = new ArrayList<>();
            if (root.has("subtasks")) {
                for (JsonNode n : root.get("subtasks")) {
                    subtasks.add(new AgentResult.SubIssueDraft(
                            n.path("title").asText("Untitled subtask"),
                            n.path("description").asText("")));
                }
            }
            String notes = root.path("architectureNotes").asText("");
            String mermaid = root.path("mermaidDiagram").asText("");

            StringBuilder comment = new StringBuilder("**ArchitectAI**\n\n").append(notes);
            if (mermaid != null && !mermaid.isBlank()) {
                comment.append("\n\n```mermaid\n").append(mermaid).append("\n```");
            }

            return new AgentResult(AgentType.ARCHITECT_AI, subtasks, comment.toString(), raw, modelName, true, List.of());
        } catch (Exception e) {
            return AgentResult.commentOnly(AgentType.ARCHITECT_AI,
                    "**ArchitectAI** could not parse a structured response and will retry automatically.",
                    raw, modelName);
        }
    }

    private static String emptyIfNull(String s) { return s == null ? "" : s; }
}
