import { TARGET_LANG } from "@/lib/language";

export type NeologismSuggestion = {
  suggested_word: string;
  transliteration: string;
  etymology: string;
};

export type ModelResult = {
  provider: string;
  suggestions: NeologismSuggestion[];
  tokensUsed: number;
};

export function getSystemPrompt(): string {
  const guidelineLines = TARGET_LANG.guidelines
    .map((g) => `- ${g}`)
    .join("\n");

  return `You are a ${TARGET_LANG.name} language expert and creative neologist. Your task is to propose elegant, natural-sounding ${TARGET_LANG.name} neologisms for foreign words and concepts that currently lack native ${TARGET_LANG.name} equivalents.

Guidelines:
- Create words that feel natural in ${TARGET_LANG.name} phonology and morphology
${guidelineLines}
- Provide clear etymological reasoning for each suggestion
- Include both the ${TARGET_LANG.scriptName} script and a Latin transliteration

Respond ONLY with valid JSON - no markdown, no code fences, no extra text.
Return an array of 3-5 suggestions in this exact JSON format:
[
  {
    "suggested_word": "${TARGET_LANG.name} word in ${TARGET_LANG.scriptName} script",
    "transliteration": "Latin script pronunciation",
    "etymology": "Explanation of roots and why this word works"
  }
]`;
}

export function buildUserPrompt(
  foreignWord: string,
  definition: string,
  contextExample?: string | null,
): string {
  let prompt = `<user_input>
<foreign_word>${foreignWord}</foreign_word>
<definition>${definition}</definition>`;

  if (contextExample) {
    prompt += `\n<usage_example>${contextExample}</usage_example>`;
  }

  prompt += `\n</user_input>

Propose 3-5 ${TARGET_LANG.name} neologisms for the concept described in the user_input above. Return ONLY the JSON array.`;

  return prompt;
}

/** Parse AI response text into suggestions, handling markdown fences and wrapper objects */
export function parseJsonResponse(text: string): NeologismSuggestion[] {
  const stripped = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  const parsed = JSON.parse(stripped);
  // json_object mode may wrap the array in an object like { "suggestions": [...] }
  let candidates: unknown[];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else {
    const values = Object.values(parsed);
    const arr = values.find((v) => Array.isArray(v));
    if (!arr) throw new Error("Unexpected JSON structure from model");
    candidates = arr as unknown[];
  }

  // Validate each suggestion has required fields and reasonable lengths
  const validated = candidates.filter(
    (s): s is NeologismSuggestion =>
      typeof s === "object" &&
      s !== null &&
      typeof (s as Record<string, unknown>).suggested_word === "string" &&
      typeof (s as Record<string, unknown>).transliteration === "string" &&
      typeof (s as Record<string, unknown>).etymology === "string" &&
      ((s as Record<string, unknown>).suggested_word as string).length <= 200 &&
      ((s as Record<string, unknown>).etymology as string).length <= 2000
  );

  if (validated.length === 0) {
    throw new Error("No valid suggestions in model response");
  }

  return validated;
}
