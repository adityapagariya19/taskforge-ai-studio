package com.taskforge.aiagent.domain;

import java.util.List;

public record AgentResult(
        AgentType agentType,
        List<SubIssueDraft> subIssues,
        String commentMarkdown,
        String rawModelOutput,
        String modelUsed,
        boolean success,
        List<GeneratedFile> files
) {
    public record SubIssueDraft(String title, String description) {}

    /** A single file CodeAI produced — persisted structurally so it can be zipped for download, not just read as markdown. */
    public record GeneratedFile(String filename, String language, String content) {}

    public static AgentResult commentOnly(AgentType type, String comment, String raw, String model) {
        return new AgentResult(type, List.of(), comment, raw, model, true, List.of());
    }

    public static AgentResult withFiles(AgentType type, String comment, String raw, String model, List<GeneratedFile> files) {
        return new AgentResult(type, List.of(), comment, raw, model, true, files);
    }

    public static AgentResult failed(AgentType type, String reason) {
        return new AgentResult(type, List.of(), null, reason, null, false, List.of());
    }
}
