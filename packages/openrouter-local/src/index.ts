export const type = "openrouter_ai";
export const label = "OpenRouter AI (any model)";

export const models: { id: string; label: string }[] = [
  // Free models
  { id: "deepseek/deepseek-chat", label: "DeepSeek Chat (free)" },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (free)" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (free)" },
  { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B (free)" },
  
  // Cheap models
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini ($0.15/M)" },
  { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku ($0.25/M)" },
  
  // Premium models
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 ($3/M)" },
  { id: "openai/gpt-4o", label: "GPT-4o ($2.5/M)" },
  { id: "openai/o3", label: "OpenAI o3 ($10/M)" },
];

export const agentConfigurationDoc = `# openrouter_ai agent configuration

Adapter: openrouter_ai
Registration: external plugin (loaded via adapter plugin system).

Use when:
- You want access to 100+ LLM models via OpenRouter's unified API
- You need cost optimization (free models like DeepSeek, Gemini Flash)
- You want token tracking and automatic cost estimation
- You need flexibility to switch models without changing adapter

Don't use when:
- You need provider-specific features not exposed via OpenRouter
- You require direct provider authentication (use provider-specific adapters)

Core fields:
- baseUrl (string, required): OpenRouter API base URL (default: https://openrouter.ai/api/v1)
- apiKey (string, required): Your OpenRouter API key (get at openrouter.ai/keys)
- model (string, required): Model ID (e.g., "deepseek/deepseek-chat", "google/gemini-3.1-flash-lite")
- timeoutSec (number, optional): Request timeout in seconds (default: 120)
- graceSec (number, optional): Grace period after timeout before SIGKILL (default: 15)
- maxTurnsPerRun (number, optional): Maximum conversation turns per heartbeat (default: 200)
- instructionsFilePath (string, optional): Absolute path to markdown instructions file
- env (object, optional): Additional environment variables

Notes:
- OpenRouter provides a unified OpenAI-compatible API for 100+ models
- Token usage is tracked and returned in execution results
- Cost estimation is automatic based on OpenRouter's published pricing
- Free models available: DeepSeek Chat, Gemini Flash, Llama 3, Qwen
- Models are specified using OpenRouter's format: "provider/model-name"
- Get your API key at: https://openrouter.ai/keys
- Browse models at: https://openrouter.ai/models
`;

export { createServerAdapter } from "./server/index.js";
