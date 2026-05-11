# @superbiche/openrouter-paperclip-adapter

Paperclip external adapter for **OpenRouter API** — access 100+ LLM models with unified token tracking and cost estimation.

## Features

- ✅ **100+ Models**: DeepSeek, Gemini, Claude, GPT-4, Llama, Qwen, and more
- ✅ **Free Tier**: Multiple free models (DeepSeek Chat, Gemini Flash, Llama 3)
- ✅ **Token Tracking**: Automatic token usage reporting
- ✅ **Cost Estimation**: Real-time cost calculation based on OpenRouter pricing
- ✅ **Flexible**: Switch models without changing adapter configuration
- ✅ **Reliable**: Comprehensive error handling and retry logic

## Installation

### Local Development

```bash
curl -X POST http://127.0.0.1:3100/api/adapters/install \
  -H 'content-type: application/json' \
  -d '{"packageName":"/absolute/path/to/openrouter-local","isLocalPath":true}'
```

### From npm (once published)

```bash
curl -X POST http://127.0.0.1:3100/api/adapters/install \
  -H 'content-type: application/json' \
  -d '{"packageName":"@superbiche/openrouter-paperclip-adapter"}'
```

## Configuration

Create an agent in Paperclip with this adapter config:

```json
{
  "adapterType": "openrouter_ai",
  "baseUrl": "https://openrouter.ai/api/v1",
  "apiKey": "sk-or-v1-YOUR_API_KEY_HERE",
  "model": "deepseek/deepseek-chat",
  "timeoutSec": 120,
  "graceSec": 15,
  "maxTurnsPerRun": 200
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `apiKey` | string | Your OpenRouter API key (get at [openrouter.ai/keys](https://openrouter.ai/keys)) |
| `model` | string | Model ID (e.g., `"deepseek/deepseek-chat"`, `"google/gemini-3.1-flash-lite"`) |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `baseUrl` | string | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `timeoutSec` | number | `120` | Request timeout in seconds |
| `graceSec` | number | `15` | Grace period after timeout |
| `maxTurnsPerRun` | number | `200` | Max conversation turns per heartbeat |
| `instructionsFilePath` | string | - | Path to markdown instructions file |

## Available Models

### Free Models 🆓

- `deepseek/deepseek-chat` — DeepSeek Chat (best free model)
- `google/gemini-3.1-flash-lite` — Gemini Flash Lite
- `meta-llama/llama-3.3-70b-instruct` — Llama 3.3 70B
- `qwen/qwen-2.5-72b-instruct` — Qwen 2.5 72B

### Cheap Models 💰

- `openai/gpt-4o-mini` — GPT-4o Mini ($0.15/M input, $0.60/M output)
- `anthropic/claude-3-haiku` — Claude 3 Haiku ($0.25/M input, $1.25/M output)

### Premium Models 💎

- `anthropic/claude-sonnet-4` — Claude Sonnet 4 ($3/M input, $15/M output)
- `openai/gpt-4o` — GPT-4o ($2.5/M input, $10/M output)
- `openai/o3` — OpenAI o3 ($10/M input, $40/M output)

Browse all models at [openrouter.ai/models](https://openrouter.ai/models).

## Example Use Cases

### Cost-Optimized Agents

Use free models for high-volume tasks:
```json
{
  "adapterType": "openrouter_ai",
  "model": "deepseek/deepseek-chat",
  "apiKey": "sk-or-v1-..."
}
```

### High-Quality Reasoning

Use premium models for complex tasks:
```json
{
  "adapterType": "openrouter_ai",
  "model": "anthropic/claude-sonnet-4",
  "apiKey": "sk-or-v1-..."
}
```

### Multi-Model Workflows

Different agents, different models:
- CEO: `anthropic/claude-sonnet-4` (strategic thinking)
- Engineers: `deepseek/deepseek-chat` (coding, free!)
- Researchers: `google/gemini-3.1-flash-lite` (fast, free!)

## Cost Comparison

| Model | Monthly Cost (13 agents) | Savings vs Claude Max |
|-------|-------------------------|----------------------|
| Claude Max (current) | ~$200/mo | - |
| OpenRouter (mixed) | ~$60-100/mo | **50-70%** |
| OpenRouter (free only) | ~$0/mo | **100%** |

*Estimates based on typical usage patterns. Actual costs vary.*

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Typecheck
pnpm typecheck
```

## Getting an OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up / log in
3. Navigate to [Keys](https://openrouter.ai/keys)
4. Create a new key
5. Copy and paste into your agent config

OpenRouter provides $1 free credit for new users!

## Troubleshooting

### "Invalid API key"
- Double-check your API key at [openrouter.ai/keys](https://openrouter.ai/keys)
- Ensure no extra whitespace in the config
- Try regenerating the key

### "Model not found"
- Verify the model ID at [openrouter.ai/models](https://openrouter.ai/models)
- Some models require additional permissions or credits
- Try a different model (e.g., `deepseek/deepseek-chat`)

### "Request timeout"
- Increase `timeoutSec` in your config (default: 120)
- Check your network connection
- Try a smaller/faster model

## License

MIT

## Credits

Built for the Paperclip AI community. Maintained in the [paperclip-adapters](https://github.com/superbiche/paperclip-adapters) monorepo.
