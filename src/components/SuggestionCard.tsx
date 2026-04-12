import type { AiSuggestion } from "@/types/database";

const MODEL_BADGES: Record<string, { label: string; className: string }> = {
  "claude-opus-4-6": {
    label: "Claude",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 dark:shadow-[0_0_12px_rgba(168,85,247,0.4)]",
  },
  "gpt-5.4": {
    label: "GPT",
    className:
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 dark:shadow-[0_0_12px_rgba(34,197,94,0.4)]",
  },
  "gemini-3.1-pro-preview": {
    label: "Gemini",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 dark:shadow-[0_0_12px_rgba(59,130,246,0.4)]",
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
      "bg-neutral-100 text-neutral-700 dark:bg-white/[0.1] dark:text-neutral-300",
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.1] dark:bg-white/[0.06] dark:backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xl font-bold">{suggestion.suggested_word}</span>
          {suggestion.transliteration && (
            <span className="ml-2 text-sm text-neutral-400 dark:text-[#8A8F98]">
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
      <p className="mt-2 text-sm text-neutral-600 dark:text-[#8A8F98]">
        {suggestion.etymology}
      </p>
    </div>
  );
}
