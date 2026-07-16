package com.taskforge.aiagent.llm;

/**
 * Pluggable LLM boundary. Every AI agent depends on this interface only —
 * never on Ollama directly — so the model/provider can be swapped (e.g. for a
 * hosted free-tier API like Groq in production) without touching agent code.
 */
public interface LLMClient {
    /**
     * Calls the model and returns its raw text response. Agents that need
     * structured output ask the model (via systemPrompt) to reply with JSON
     * and parse it themselves — keeps this interface provider-agnostic.
     */
    String complete(String systemPrompt, String userPrompt);
}
