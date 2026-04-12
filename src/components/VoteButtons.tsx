"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VoteButtons({
  suggestionId,
  initialScore,
  initialVote,
}: {
  suggestionId: string;
  initialScore: number;
  initialVote: number | null;
}) {
  const [score, setScore] = useState(initialScore);
  const [currentVote, setCurrentVote] = useState<number | null>(initialVote);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVote = async (voteType: 1 | -1) => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const prevScore = score;
    const prevVote = currentVote;

    if (currentVote === voteType) {
      // Toggle off
      setScore(score - voteType);
      setCurrentVote(null);
    } else if (currentVote !== null) {
      // Switch vote
      setScore(score - currentVote + voteType);
      setCurrentVote(voteType);
    } else {
      // New vote
      setScore(score + voteType);
      setCurrentVote(voteType);
    }

    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestion_id: suggestionId, vote_type: voteType }),
    });

    if (!res.ok) {
      // Rollback
      setScore(prevScore);
      setCurrentVote(prevVote);
    } else {
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`rounded p-1 transition-colors ${
          currentVote === 1
            ? "text-green-600 dark:text-green-400"
            : "text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400"
        }`}
        title="Upvote"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <span
        className={`min-w-[2ch] text-center text-sm font-medium ${
          score > 0
            ? "text-green-600 dark:text-green-400"
            : score < 0
              ? "text-red-600 dark:text-red-400"
              : "text-neutral-500"
        }`}
      >
        {score}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`rounded p-1 transition-colors ${
          currentVote === -1
            ? "text-red-600 dark:text-red-400"
            : "text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400"
        }`}
        title="Downvote"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path
            fillRule="evenodd"
            d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
