import type { AiSuggestion } from "@/types/database";

const MODEL_BADGES: Record<string, { label: string; className: string }> = {
  "claude-opus-4-6": {
    label: "Claude",
    className: "au-badge-claude",
  },
  "gpt-5.4": {
    label: "GPT",
    className: "au-badge-gpt",
  },
  "gemini-3.1-pro-preview": {
    label: "Gemini",
    className: "au-badge-gemini",
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
    className: "au-badge-default",
  };

  return (
    <div className="au-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xl font-bold">{suggestion.suggested_word}</span>
          {suggestion.transliteration && (
            <span className="ml-2 text-sm au-text-muted">
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
      <p className="mt-2 text-sm au-text-secondary">
        {suggestion.etymology}
      </p>
    </div>
  );
}
