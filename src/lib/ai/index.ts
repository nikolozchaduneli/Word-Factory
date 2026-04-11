import { generateClaude } from "./claude";
import { generateGPT } from "./openai";
import { generateGemini } from "./gemini";
import type { ModelResult } from "./types";

export type { NeologismSuggestion, ModelResult } from "./types";

export async function generateFromAllModels(
  foreignWord: string,
  definition: string,
  contextExample?: string | null,
): Promise<ModelResult[]> {
  const results = await Promise.allSettled([
    generateClaude(foreignWord, definition, contextExample),
    generateGPT(foreignWord, definition, contextExample),
    generateGemini(foreignWord, definition, contextExample),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[AI] Model call failed:", result.reason);
    }
  }

  return results
    .filter(
      (r): r is PromiseFulfilledResult<ModelResult | null> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value)
    .filter((v): v is ModelResult => v !== null);
}
