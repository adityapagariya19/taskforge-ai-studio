# AI Provider Guide

TaskForge's AI agents depend only on the `LLMClient` interface (`aiagent/llm/LLMClient.java`), never on a specific provider. Which implementation runs is decided entirely by environment variables — switching providers is a deployment config change, never a code change.

## Local development (default): Ollama

No setup beyond what's in the main Implementation Guide (`docs/03`) — `TASKFORGE_AI_PROVIDER` defaults to `ollama`, and `OllamaLLMClient` talks to your local `ollama serve`.

## Production / any non-local deployment: cloud provider

Set `TASKFORGE_AI_PROVIDER=cloud`. `CloudLLMClient` then activates — a real OpenAI-compatible chat-completions client that works unmodified against any of the providers below, because they all implement the same `/chat/completions` shape.

| Env var | Required | Example (Groq, free tier) |
|---|---|---|
| `TASKFORGE_AI_PROVIDER` | yes | `cloud` |
| `TASKFORGE_AI_CLOUD_BASE_URL` | yes | `https://api.groq.com/openai/v1` |
| `TASKFORGE_AI_CLOUD_API_KEY` | yes | (your Groq API key) |
| `TASKFORGE_AI_CLOUD_MODEL` | yes | `llama-3.3-70b-versatile` |
| `TASKFORGE_AI_CLOUD_PROVIDER_LABEL` | no | `Groq` (used only in error messages) |

### Tested-shape provider options (free-tier-compatible for development)

- **Groq** — `https://api.groq.com/openai/v1`, no credit card required, generous free rate limits, serves open models (Llama 3.x) on fast hardware.
- **OpenRouter** — `https://openrouter.ai/api/v1`, routes to many open models, several with free tiers; set `TASKFORGE_AI_CLOUD_MODEL` to any OpenRouter model id.
- **Together AI** — `https://api.together.xyz/v1`, free trial credits, open models.
- **OpenAI** — `https://api.openai.com/v1`, paid, included only because it's the reference implementation of this API shape — any of the above is preferable for a free-tier development setup.

### What happens if you misconfigure it

`CloudLLMClient` fails loudly and specifically:
- Missing `base-url` → fails at application startup with the exact env var name to set.
- Missing `api-key` or `model` → fails on the first AI agent call, with the exact env var name to set.
- Provider returns an error (bad key, rate limit, network failure) → the underlying HTTP error message is included in the thrown exception, surfaced to the `ai_agent_executions.error_message` column and visible in the issue's AI execution history in the UI.

None of these paths return a fake/simulated AI response — per the platform's "no fake AI execution" rule, an unconfigured or failing integration must be visibly broken, not invisibly faked. This is a deliberate, audited design decision, not an oversight.

## Adding a provider that isn't OpenAI-compatible

If you want a provider with a genuinely different request/response shape (e.g. Anthropic's native API, Google's Gemini native API), add a new class implementing `LLMClient`, annotate it `@ConditionalOnProperty(name = "taskforge.ai.provider", havingValue = "<your-value>")`, and set `TASKFORGE_AI_PROVIDER` accordingly. No existing agent class changes — this is the entire point of the interface boundary.
