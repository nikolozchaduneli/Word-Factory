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
      className="rounded-lg bg-[#5E6AD2] px-4 py-2 text-sm font-medium text-white shadow-[0_0_15px_rgba(94,106,210,0.2)] transition-colors hover:bg-[#6872D9] disabled:opacity-50"
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
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading && (
        <div className="mb-3 rounded-lg border border-neutral-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[#5E6AD2] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-[#5E6AD2] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-[#5E6AD2] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {TARGET_LANG.ui.generatingText}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-white/[0.06]" />
            <div className="h-3 w-full animate-pulse rounded bg-neutral-100 dark:bg-white/[0.03]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-white/[0.06]" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-100 dark:bg-white/[0.03]" />
          </div>
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-white/[0.1]">
          <p className="text-neutral-500 mb-3">No suggestions yet.</p>
          {generateButton}
          {!isLoggedIn && (
            <p className="text-sm text-neutral-400 mt-2">
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
                <span className="text-sm font-medium text-neutral-500">
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
