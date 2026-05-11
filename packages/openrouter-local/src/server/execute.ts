import {
  type AdapterExecutionContext,
  type AdapterExecutionResult,
  type AdapterEnvironmentTestContext,
  type AdapterEnvironmentTestResult,
  type AdapterEnvironmentTestStatus,
  type AdapterEnvironmentCheckLevel,
} from "@paperclipai/adapter-utils";
import { OpenRouterClient, OpenRouterMessage, OpenRouterApiError } from "./openrouter-client";

export interface OpenRouterAdapterConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutSec?: number;
  graceSec?: number;
  maxTurnsPerRun?: number;
  instructionsFilePath?: string;
  env?: Record<string, string>;
}

/**
 * Execute a run using OpenRouter API
 * 
 * This is the main entry point called by Paperclip's agent runner.
 */
export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = ctx.config as unknown as OpenRouterAdapterConfig;
  const prompt = (ctx.context.prompt as string) || "";
  
  // Validate config
  if (!config.baseUrl || !config.apiKey || !config.model) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: "Missing required config: baseUrl, apiKey, and model are required",
      errorCode: "MISSING_CONFIG",
    };
  }

  // Initialize OpenRouter client
  const client = new OpenRouterClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    timeoutSec: config.timeoutSec ?? 120,
  });

  // Build messages array
  const messages: OpenRouterMessage[] = [];

  // Add system instructions if provided via instructionsFilePath
  if (config.instructionsFilePath) {
    try {
      const fs = await import("node:fs");
      const instructions = fs.readFileSync(config.instructionsFilePath, "utf-8");
      messages.push({
        role: "system",
        content: instructions,
      });
    } catch (err) {
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        errorMessage: `Failed to read instructions file: ${config.instructionsFilePath}`,
        errorCode: "INSTRUCTIONS_READ_ERROR",
      };
    }
  }

  // Add user prompt
  messages.push({
    role: "user",
    content: prompt,
  });

  try {
    // Call OpenRouter API
    const response = await client.chatCompletion(messages, {
      maxTokens: config.maxTurnsPerRun ? config.maxTurnsPerRun * 100 : undefined,
      temperature: 0.7,
    });

    // Extract response
    const choice = response.choices[0];
    if (!choice) {
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        errorMessage: "No response choices returned from OpenRouter",
        errorCode: "NO_RESPONSE",
      };
    }

    const output = choice.message.content;
    const finishReason = choice.finish_reason;

    // Extract token usage
    const usage = response.usage;
    
    // Infer billing provider
    const billingProvider = "openrouter";
    const model = config.model;
    
    // Estimate cost
    const costEstimate = estimateCost(usage.prompt_tokens, usage.completion_tokens, model);

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
      },
      provider: billingProvider,
      biller: billingProvider,
      model: model,
      costUsd: costEstimate,
      resultJson: {
        openrouter_response_id: response.id,
        openrouter_model: response.model,
        finish_reason: finishReason,
        cost_estimate_usd: costEstimate,
      },
      summary: output,
    };
  } catch (error) {
    if (error instanceof OpenRouterApiError) {
      // Handle specific error types
      if (error.isAuthError() || error.isRateLimit()) {
        // Transient errors that might succeed on retry
        return {
          exitCode: 1,
          signal: null,
          timedOut: false,
          errorMessage: error.isAuthError()
            ? `OpenRouter authentication failed: ${error.message}. Check your API key.`
            : `OpenRouter rate limit exceeded: ${error.message}. Try again later.`,
          errorCode: error.isAuthError() ? "AUTH_ERROR" : "RATE_LIMIT",
          errorFamily: "transient_upstream",
          retryNotBefore: error.isRateLimit() ? new Date(Date.now() + 60000).toISOString() : undefined,
        };
      }

      if (error.isNotFound()) {
        return {
          exitCode: 1,
          signal: null,
          timedOut: false,
          errorMessage: `Model not found: ${config.model}. Check the model ID on openrouter.ai/models`,
          errorCode: "MODEL_NOT_FOUND",
        };
      }

      // Generic API error
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        errorMessage: `OpenRouter API error (${error.statusCode}): ${error.message}`,
        errorCode: "API_ERROR",
      };
    }

    // Unknown error
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

/**
 * Estimate cost based on OpenRouter pricing (as of May 2026)
 * This is a rough estimate - actual costs may vary
 */
function estimateCost(tokensIn: number, tokensOut: number, model: string): number | null {
  // Pricing per 1M tokens (USD)
  const pricing: Record<string, { input: number; output: number }> = {
    // Free models
    "deepseek/deepseek-chat": { input: 0, output: 0 },
    "google/gemini-2.0-flash-exp": { input: 0, output: 0 },
    "meta-llama/llama-3.3-70b-instruct": { input: 0, output: 0 },
    "qwen/qwen-2.5-72b-instruct": { input: 0, output: 0 },
    
    // Cheap models
    "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
    "anthropic/claude-3-haiku": { input: 0.25, output: 1.25 },
    
    // Premium models
    "anthropic/claude-sonnet-4": { input: 3.0, output: 15.0 },
    "openai/gpt-4o": { input: 2.5, output: 10.0 },
    "openai/o3": { input: 10.0, output: 40.0 },
  };

  const modelPricing = pricing[model] ?? { input: 0.5, output: 1.5 }; // Default fallback
  
  const inputCost = (tokensIn / 1_000_000) * modelPricing.input;
  const outputCost = (tokensOut / 1_000_000) * modelPricing.output;
  
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Test environment function - checks if OpenRouter API is accessible
 */
export async function testEnvironment(ctx: AdapterEnvironmentTestContext): Promise<AdapterEnvironmentTestResult> {
  const config = ctx.config as unknown as OpenRouterAdapterConfig;
  
  // Simple connectivity check
  let testStatus: AdapterEnvironmentTestStatus = "pass";
  let message = "OpenRouter API is accessible";
  let level: AdapterEnvironmentCheckLevel = "info";
  
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.apiKey || "test"}`,
      },
      signal: controller.signal,
    });
    
    if (response.status === 401) {
      testStatus = "fail";
      message = "Invalid API key";
      level = "error";
    } else if (!response.ok) {
      testStatus = "warn";
      message = `OpenRouter API responded with status ${response.status}`;
      level = "warn";
    }
  } catch (error) {
    testStatus = "fail";
    message = error instanceof Error ? error.message : "Failed to connect to OpenRouter API";
    level = "error";
  }
  
  return {
    adapterType: "openrouter_ai",
    status: testStatus,
    checks: [
      {
        code: "api_connectivity",
        level,
        message,
      },
    ],
    testedAt: new Date().toISOString(),
  };
}
