"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AiSuggestion } from "@/types/database";
import { TARGET_LANG } from "@/lib/language";
import SuggestionCard from "./SuggestionCard";
import VoteButtons from "./VoteButtons";

export default function SuggestionsSection({
  wordSubmissionId,
  isLoggedIn,
  suggestions,
  userVotes,
  canGenerate,
}: {
  wordSubmissionId: string;
  isLoggedIn: boolean;
  suggestions: AiSuggestion[];
  userVotes: Record<string, number>;
  canGenerate: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordSubmissionId }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to generate suggestions");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  };

  const generateButton = canGenerate && (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="au-btn-primary px-4 py-2 text-sm"
    >
      {loading ? "Generating..." : "Generate AI Suggestions"}
    </button>
  );

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          {TARGET_LANG.ui.suggestionsHeading} ({suggestions.length})
        </h2>
        {suggestions.length > 0 && generateButton}
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-500">{error}</p>
      )}

      {loading && (
        <div className="au-card mb-3 p-6">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: "300ms" }} />
            </div>
            <p className="text-sm au-text-secondary">
              {TARGET_LANG.ui.generatingText}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded" style={{ background: "var(--skeleton)" }} />
            <div className="h-3 w-full animate-pulse rounded" style={{ background: "var(--skeleton-light)" }} />
            <div className="h-4 w-2/3 animate-pulse rounded" style={{ background: "var(--skeleton)" }} />
            <div className="h-3 w-5/6 animate-pulse rounded" style={{ background: "var(--skeleton-light)" }} />
          </div>
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="au-text-secondary mb-3">No suggestions yet.</p>
          {generateButton}
          {!isLoggedIn && (
            <p className="text-sm au-text-muted mt-2">
              <a href="/login" className="underline">Sign in</a> to generate AI suggestions
            </p>
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((sug) => (
            <SuggestionCard key={sug.id} suggestion={sug}>
              {isLoggedIn ? (
                <VoteButtons
                  suggestionId={sug.id}
                  initialScore={sug.score}
                  initialVote={userVotes[sug.id] ?? null}
                />
              ) : (
                <span className="text-sm font-medium au-text-muted">
                  {sug.score > 0 ? "+" : ""}{sug.score}
                </span>
              )}
            </SuggestionCard>
          ))}
        </div>
      )}
    </section>
  );
}
