import type { AiSuggestion } from "@/types/database";

export default function SuggestionCard({
  suggestion,
  children,
}: {
  suggestion: AiSuggestion;
  children?: React.ReactNode;
}) {
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
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            AI
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
