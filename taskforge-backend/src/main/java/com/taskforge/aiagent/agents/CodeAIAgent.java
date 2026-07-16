package com.taskforge.aiagent.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskforge.aiagent.domain.*;
import com.taskforge.aiagent.llm.LLMClient;
import org.springframework.stereotype.Component;

/**
 * The agent that actually writes code for an assigned task — e.g. "create a
 * web page with a working login page with backend" produces real HTML/JS and
 * a real backend file, returned as fenced code blocks on the issue's comment
 * thread. The user copies the files out; nothing here auto-executes code.
 */
@Component
public class CodeAIAgent implements AIAgent {

    private static final String SYSTEM_PROMPT = """
        You are CodeAI, a software engineer embedded in a project management tool.
        You are assigned engineering tasks and must actually implement them, not
        just describe them. Respond with JSON ONLY, no prose outside the JSON,
        matching exactly this shape:
        {
          "implementationPlan": "string - a short paragraph describing your approach",
          "files": [
            {"filename": "string, e.g. login.html or LoginController.java",
             "language": "string, e.g. html, javascript, java, css",
             "code": "string - the complete, working code for this file"}
          ]
        }
        Produce real, complete, runnable code for every file needed to satisfy the
        task description. If the task asks for a page with a backend, include both
        the frontend file(s) and a working backend file/snippet. Prefer fewer,
        complete files over many partial ones.
        """;

    private final LLMClient llmClient;
    private final ObjectMapper mapper = new ObjectMapper();

    public CodeAIAgent(LLMClient llmClient) {
        this.llmClient = llmClient;
    }

    @Override
    public AgentType type() { return AgentType.CODE_AI; }

    @Override
    public AgentResult execute(AgentContext context) {
        String userPrompt = """
            Task title: %s
            Task description: %s
            Recent comments (may include architecture notes from ArchitectAI to follow): %s
            """.formatted(context.issueTitle(),
                emptyIfNull(context.issueDescription()), emptyIfNull(context.recentCommentsContext()));

        String raw;
        try {
            raw = llmClient.complete(SYSTEM_PROMPT, userPrompt);
        } catch (Exception e) {
            return AgentResult.failed(AgentType.CODE_AI, e.getMessage());
        }

        try {
            JsonNode root = mapper.readTree(raw);
            String plan = root.path("implementationPlan").asText("");
            StringBuilder comment = new StringBuilder("**CodeAI implementation**\n\n").append(plan).append("\n\n");

            java.util.List<AgentResult.GeneratedFile> files = new java.util.ArrayList<>();
            if (root.has("files")) {
                for (JsonNode file : root.get("files")) {
                    String filename = file.path("filename").asText("file.txt");
                    String language = file.path("language").asText("");
                    String code = file.path("code").asText("");
                    files.add(new AgentResult.GeneratedFile(filename, language, code));
                    comment.append("**`").append(filename).append("`**\n```")
                           .append(language).append("\n").append(code).append("\n```\n\n");
                }
            }
            if (!files.isEmpty()) {
                comment.append("_").append(files.size()).append(" file(s) generated — download as a zip from the button above._\n");
            }

            return AgentResult.withFiles(AgentType.CODE_AI, comment.toString(), raw, "configured-model", files);
        } catch (Exception e) {
            return AgentResult.commentOnly(AgentType.CODE_AI,
                    "**CodeAI** could not parse a structured response and will retry automatically.",
                    raw, "configured-model");
        }
    }

    private static String emptyIfNull(String s) { return s == null ? "" : s; }
}
