import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt, buildUserPrompt, parseJsonResponse } from "./types";
import type { ModelResult } from "./types";

export async function generateClaude(
  foreignWord: string,
  definition: string,
  contextExample?: string | null,
): Promise<ModelResult | null> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null;

  const client = new Anthropic();
  const userPrompt = buildUserPrompt(foreignWord, definition, contextExample);

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: 10000,
    },
    system: getSystemPrompt(),
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock ? textBlock.text : "";

  const tokensUsed =
    (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

  const suggestions = parseJsonResponse(text);

  return { provider: "claude-opus-4-6", suggestions, tokensUsed };
}
