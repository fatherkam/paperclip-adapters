import { describe, it, expect } from "vitest";
import { type, label, models } from "../index.js";

describe("openrouter_ai adapter", () => {
  it("should export correct adapter type", () => {
    expect(type).toBe("openrouter_ai");
  });
  
  it("should export label", () => {
    expect(label).toBe("OpenRouter AI (any model)");
  });
  
  it("should export models array", () => {
    expect(models).toBeInstanceOf(Array);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("label");
  });
  
  it("should include free models", () => {
    const freeModels = models.filter(m => m.id.includes("deepseek") || m.id.includes("gemini"));
    expect(freeModels.length).toBeGreaterThan(0);
  });
});
