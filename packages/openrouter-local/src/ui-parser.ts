/**
 * UI Parser for OpenRouter adapter
 * 
 * This module runs in the browser sandbox to parse run logs
 * for display in the Paperclip UI.
 * 
 * Contract: Must have zero runtime imports and no side effects.
 */

// Minimal transcript entry type for UI rendering
interface ParsedEntry {
  type: 'assistant_message' | 'system_log' | 'error' | 'stdout';
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export function parseTranscript(stdout: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  
  // Parse OpenRouter API response logs
  const lines = stdout.split("\n").filter(line => line.trim());
  
  for (const line of lines) {
    try {
      // Try to parse as JSON (API responses)
      const parsed = JSON.parse(line);
      
      if (parsed.choices?.[0]?.message?.content) {
        entries.push({
          type: "assistant_message",
          content: parsed.choices[0].message.content,
          timestamp: new Date().toISOString(),
          metadata: {
            model: parsed.model,
            usage: parsed.usage,
            finish_reason: parsed.choices[0].finish_reason,
          },
        });
      } else if (parsed?.error?.message) {
        // Handle API error responses
        entries.push({
          type: "error",
          content: String(parsed.error.message),
          timestamp: new Date().toISOString(),
          metadata: {
            code: parsed.error.code,
            type: parsed.error.type,
          },
        });
      } else {
        // Unrecognized JSON - show as stdout
        entries.push({
          type: "stdout",
          content: line,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Not JSON, treat as plain text log
      if (line.startsWith("[INFO]") || line.startsWith("[DEBUG]")) {
        entries.push({
          type: "system_log",
          content: line,
          timestamp: new Date().toISOString(),
        });
      } else if (line.startsWith("[ERROR]")) {
        entries.push({
          type: "error",
          content: line,
          timestamp: new Date().toISOString(),
        });
      } else {
        entries.push({
          type: "stdout",
          content: line,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
  
  return entries;
}
