import type {
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
  AdapterEnvironmentCheck,
} from "@paperclipai/adapter-utils";
import { type as adapterType } from "../index.js";

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = ctx.config as Record<string, unknown>;
  
  // Check API key
  const apiKey = String(config.apiKey ?? "");
  if (!apiKey) {
    checks.push({
      level: "error",
      message: "OpenRouter API key is required",
      hint: "Get your API key at https://openrouter.ai/keys",
      code: "missing_api_key",
    });
  } else if (apiKey.length < 10) {
    checks.push({
      level: "error",
      message: "OpenRouter API key appears too short",
      hint: "API keys should be at least 20 characters",
      code: "invalid_api_key",
    });
  } else {
    checks.push({
      level: "info",
      message: "OpenRouter API key present",
      code: "api_key_present",
    });
  }
  
  // Check model
  const model = String(config.model ?? "");
  if (!model) {
    checks.push({
      level: "error",
      message: "Model is required",
      hint: "Specify a model like 'deepseek/deepseek-chat' or 'google/gemini-3.1-flash-lite'",
      code: "missing_model",
    });
  } else {
    checks.push({
      level: "info",
      message: `Model configured: ${model}`,
      code: "model_configured",
    });
  }
  
  // Check base URL
  const baseUrl = String(config.baseUrl ?? "https://openrouter.ai/api/v1");
  checks.push({
    level: "info",
    message: `OpenRouter API URL: ${baseUrl}`,
    code: "base_url_configured",
  });
  
  // Test API connectivity (optional, non-blocking)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey || "test"}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      checks.push({
        level: "info",
        message: "OpenRouter API is accessible",
        code: "api_connectivity_ok",
      });
    } else if (response.status === 401) {
      checks.push({
        level: "error",
        message: "OpenRouter API authentication failed",
        hint: "Check your API key at https://openrouter.ai/keys",
        code: "api_auth_failed",
      });
    } else {
      checks.push({
        level: "warn",
        message: `OpenRouter API responded with status ${response.status}`,
        code: "api_unexpected_response",
      });
    }
  } catch (error) {
    checks.push({
      level: "warn",
      message: `Could not connect to OpenRouter API: ${error instanceof Error ? error.message : "Unknown error"}`,
      hint: "Check your network connection and firewall settings",
      code: "api_connection_failed",
    });
  }
  
  const hasErrors = checks.some(c => c.level === "error");
  
  return {
    adapterType: adapterType,
    status: hasErrors ? "fail" : "pass",
    checks,
    testedAt: new Date().toISOString(),
  };
}
