import { inferOpenAiCompatibleBiller } from "@paperclipai/adapter-utils";

export interface OpenRouterConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutSec?: number;
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: OpenRouterMessage;
    finish_reason: string;
  }>;
  usage: OpenRouterUsage;
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * OpenRouter API client
 * Makes HTTP calls to OpenRouter's OpenAI-compatible API
 */
export class OpenRouterClient {
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    this.config = config;
  }

  /**
   * Send a chat completion request to OpenRouter
   */
  async chatCompletion(
    messages: OpenRouterMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<OpenRouterResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const body: OpenRouterRequest = {
      model: this.config.model,
      messages,
      max_tokens: options?.maxTokens,
      temperature: options?.temperature ?? 0.7,
      stream: false,
    };

    const timeoutMs = (this.config.timeoutSec ?? 120) * 1000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "HTTP-Referer": "https://paperclip.ing", // Required by OpenRouter
          "X-Title": "Paperclip", // Optional but nice
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json()) as OpenRouterError;
        throw new OpenRouterApiError(
          errorData.error.message,
          response.status,
          errorData.error.code
        );
      }

      const data = (await response.json()) as OpenRouterResponse;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenRouterApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterApiError(
          `Request timed out after ${timeoutMs}ms`,
          408,
          "timeout"
        );
      }
      throw new OpenRouterApiError(
        error instanceof Error ? error.message : "Unknown error",
        500,
        "unknown"
      );
    }
  }

  /**
   * Extract billing provider from model ID
   * Uses the adapter-utils helper for OpenAI-compatible APIs
   */
  getBillingProvider(env: Record<string, string> | undefined): string {
    return inferOpenAiCompatibleBiller(env ?? {}, null) ?? "openrouter";
  }
}

/**
 * Custom error class for OpenRouter API errors
 */
export class OpenRouterApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "OpenRouterApiError";
  }

  isRateLimit(): boolean {
    return this.statusCode === 429;
  }

  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  isNotFound(): boolean {
    return this.statusCode === 404;
  }
}
