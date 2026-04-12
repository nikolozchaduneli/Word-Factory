import OpenAI from "openai";
import { getSystemPrompt, buildUserPrompt, parseJsonResponse } from "./types";
import type { ModelResult } from "./types";

export async function generateGemini(
  foreignWord: string,
  definition: string,
  contextExample?: string | null,
): Promise<ModelResult | null> {
  if (!process.env.GOOGLE_AI_API_KEY?.trim()) return null;

  const client = new OpenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
  const userPrompt = buildUserPrompt(foreignWord, definition, contextExample);

  const response = await client.chat.completions.create({
    model: "gemini-3.1-pro-preview",
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: getSystemPrompt() },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  const tokensUsed =
    (response.usage?.prompt_tokens ?? 0) +
    (response.usage?.completion_tokens ?? 0);

  const suggestions = parseJsonResponse(text);

  return { provider: "gemini-3.1-pro-preview", suggestions, tokensUsed };
}
