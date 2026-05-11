/**
 * UI Parser for OpenRouter adapter
 * 
 * This module runs in the browser sandbox to parse run logs
 * for display in the Paperclip UI.
 * 
 * Contract: Must have zero runtime imports and no side effects.
 */

import type { TranscriptEntry } from "@paperclipai/adapter-utils";

export function parseTranscript(stdout: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  
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
