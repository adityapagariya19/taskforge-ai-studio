package com.taskforge.aiagent.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Local-development default: talks to a locally running Ollama instance.
 * Active when taskforge.ai.provider=ollama or the property is unset
 * (matchIfMissing=true), so existing local setups keep working unchanged.
 * For any non-local deployment, set TASKFORGE_AI_PROVIDER=cloud and
 * configure {@link CloudLLMClient} instead — see docs/05-AI-Provider-Guide.md.
 */
@Component
@ConditionalOnProperty(name = "taskforge.ai.provider", havingValue = "ollama", matchIfMissing = true)
public class OllamaLLMClient implements LLMClient {

    private final RestClient restClient;
    private final String model;
    private final ObjectMapper mapper = new ObjectMapper();

    public OllamaLLMClient(
            @Value("${taskforge.ollama.base-url}") String baseUrl,
            @Value("${taskforge.ollama.model}") String model) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.model = model;
    }

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("system", systemPrompt);
        body.put("prompt", userPrompt);
        body.put("format", "json"); // ask Ollama to constrain output to valid JSON
        body.put("stream", false);

        String raw;
        try {
            raw = restClient.post()
                    .uri("/api/generate")
                    .body(body)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Could not reach Ollama at the configured base-url. Is `ollama serve` running and is the model pulled? ("
                            + e.getMessage() + ")", e);
        }

        try {
            JsonNode node = mapper.readTree(raw);
            return node.get("response").asText();
        } catch (Exception e) {
            throw new IllegalStateException("Unexpected response shape from Ollama: " + raw, e);
        }
    }
}
