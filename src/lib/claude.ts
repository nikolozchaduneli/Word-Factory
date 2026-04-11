import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type NeologismSuggestion = {
  suggested_word: string;
  transliteration: string;
  etymology: string;
};

const SYSTEM_PROMPT = `You are a Georgian language expert and creative neologist. Your task is to propose elegant, natural-sounding Georgian neologisms for foreign words and concepts that currently lack native Georgian equivalents.

Guidelines:
- Create words that feel natural in Georgian phonology and morphology
- Use existing Georgian roots, prefixes, and suffixes where possible
- Draw from Old Georgian, literary Georgian, or dialectal forms when appropriate
- Consider compound words (like German does) using Georgian word-building patterns
- Provide clear etymological reasoning for each suggestion
- Include both the Georgian script and a Latin transliteration

Respond ONLY with valid JSON - no markdown, no code fences, no extra text.
Return an array of 3-5 suggestions in this exact JSON format:
[
  {
    "suggested_word": "Georgian word in Georgian script",
    "transliteration": "Latin script pronunciation",
    "etymology": "Explanation of roots and why this word works"
  }
]`;

export async function generateNeologisms(
  foreignWord: string,
  definition: string,
  contextExample?: string | null
): Promise<{ suggestions: NeologismSuggestion[]; tokensUsed: number }> {
  let userPrompt = `Foreign word: "${foreignWord}"
Definition: ${definition}`;

  if (contextExample) {
    userPrompt += `\nUsage example: "${contextExample}"`;
  }

  userPrompt +=
    "\n\nPropose 3-5 Georgian neologisms for this concept. Return ONLY the JSON array.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const tokensUsed =
    (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

  const suggestions: NeologismSuggestion[] = JSON.parse(text);

  return { suggestions, tokensUsed };
}
