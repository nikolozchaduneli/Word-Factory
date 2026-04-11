import type { AiSuggestion } from "@/types/database";

const MODEL_BADGES: Record<string, { label: string; className: string }> = {
  "claude-opus-4-6": {
    label: "Claude",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  "gpt-5.4": {
    label: "GPT",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  "gemini-3.1-pro": {
    label: "Gemini",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
};

export default function SuggestionCard({
  suggestion,
  children,
}: {
  suggestion: AiSuggestion;
  children?: React.ReactNode;
}) {
  const badge = MODEL_BADGES[suggestion.model_version] ?? {
    label: "AI",
    className:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xl font-bold">{suggestion.suggested_word}</span>
          {suggestion.transliteration && (
            <span className="ml-2 text-sm text-zinc-400">
              ({suggestion.transliteration})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          {children}
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {suggestion.etymology}
      </p>
    </div>
  );
}
