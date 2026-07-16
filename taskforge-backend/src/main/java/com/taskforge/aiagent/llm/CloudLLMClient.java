package com.taskforge.aiagent.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Production AI provider: a real OpenAI-compatible chat-completions client.
 * This single implementation works unmodified against any OpenAI-compatible
 * endpoint — Groq, OpenRouter, Together AI, Fireworks, or OpenAI itself —
 * because they all implement the same /chat/completions request/response
 * shape. Which provider is actually used is purely an environment-variable
 * decision (TASKFORGE_AI_CLOUD_BASE_URL / _API_KEY / _MODEL), never a code
 * change — this is the "abstract providers behind interfaces" requirement
 * satisfied concretely, not just architecturally.
 *
 * Active when TASKFORGE_AI_PROVIDER=cloud. If the API key is missing in that
 * mode, every call fails fast with a clear configuration error rather than
 * silently falling back to a fake/simulated response — per the platform's
 * "no fake AI execution" rule, an unconfigured integration must be visibly
 * broken, not invisibly faked.
 *
 * Setup (free-tier-compatible options for development):
 *   Groq:       base-url=https://api.groq.com/openai/v1   model=llama-3.3-70b-versatile
 *   OpenRouter: base-url=https://openrouter.ai/api/v1      model=<any free OpenRouter model id>
 *   OpenAI:     base-url=https://api.openai.com/v1         model=gpt-4o-mini (paid)
 */
@Component
@ConditionalOnProperty(name = "taskforge.ai.provider", havingValue = "cloud")
public class CloudLLMClient implements LLMClient {

    private final RestClient restClient;
    private final String model;
    private final String apiKey;
    private final String providerLabel;
    private final ObjectMapper mapper = new ObjectMapper();

    public CloudLLMClient(
            @Value("${taskforge.ai.cloud.base-url:}") String baseUrl,
            @Value("${taskforge.ai.cloud.api-key:}") String apiKey,
            @Value("${taskforge.ai.cloud.model:}") String model,
            @Value("${taskforge.ai.cloud.provider-label:cloud provider}") String providerLabel) {
        this.apiKey = apiKey;
        this.model = model;
        this.providerLabel = providerLabel;

        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException(
                    "taskforge.ai.provider=cloud but taskforge.ai.cloud.base-url is not set. "
                    + "Set TASKFORGE_AI_CLOUD_BASE_URL (e.g. https://api.groq.com/openai/v1 for Groq's free tier). "
                    + "See docs/05-AI-Provider-Guide.md.");
        }
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "AI provider is configured as '" + providerLabel + "' but no API key is set. "
                    + "Set TASKFORGE_AI_CLOUD_API_KEY. This call is intentionally failing rather than "
                    + "returning a simulated AI response — see docs/05-AI-Provider-Guide.md to finish setup.");
        }
        if (model == null || model.isBlank()) {
            throw new IllegalStateException(
                    "AI provider is configured as '" + providerLabel + "' but no model is set. "
                    + "Set TASKFORGE_AI_CLOUD_MODEL (e.g. llama-3.3-70b-versatile for Groq).");
        }

        Map<String, Object> systemMessage = Map.of("role", "system", "content", systemPrompt);
        Map<String, Object> userMessage = Map.of("role", "user", "content", userPrompt);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(systemMessage, userMessage));
        body.put("temperature", 0.2); // low temperature: agents need consistent, parseable structured output
        body.put("response_format", Map.of("type", "json_object"));

        String raw;
        try {
            raw = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Call to " + providerLabel + " failed (network error, invalid API key, or rate limit). "
                    + "Underlying error: " + e.getMessage(), e);
        }

        try {
            JsonNode root = mapper.readTree(raw);
            JsonNode choices = root.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new IllegalStateException("No choices returned: " + raw);
            }
            return choices.get(0).get("message").get("content").asText();
        } catch (Exception e) {
            throw new IllegalStateException("Unexpected response shape from " + providerLabel + ": " + raw, e);
        }
    }
}
