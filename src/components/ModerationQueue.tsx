"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FlagItem = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

type PendingWord = {
  id: string;
  foreign_word: string;
  definition: string;
  status: string;
  created_at: string;
  profiles: { display_name: string };
};

type PendingSuggestion = {
  id: string;
  suggested_word: string;
  reasoning: string | null;
  status: string;
  created_at: string;
  profiles: { display_name: string };
};

export default function ModerationQueue({
  flags,
  pendingWords,
  pendingSuggestions,
}: {
  flags: FlagItem[];
  pendingWords: PendingWord[];
  pendingSuggestions: PendingSuggestion[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (
    targetType: string,
    targetId: string,
    action: string
  ) => {
    setLoading(targetId);
    await fetch("/api/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, action }),
    });
    setLoading(null);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Flagged Content */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Flagged Content ({flags.length})
        </h2>
        {flags.length === 0 ? (
          <p className="text-sm text-neutral-500">No open flags.</p>
        ) : (
          <div className="space-y-2">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <div>
                  <span className="text-sm font-medium">
                    {flag.target_type.replace("_", " ")}
                  </span>
                  <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">
                    {flag.reason}
                  </span>
                  {flag.description && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {flag.description}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-1">
                    Reported by {flag.profiles?.display_name ?? "Unknown"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAction("flag", flag.id, "resolve")}
                    disabled={loading === flag.id}
                    className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-500"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleAction("flag", flag.id, "dismiss")}
                    disabled={loading === flag.id}
                    className="rounded bg-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-300 dark:bg-white/[0.06] dark:text-neutral-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Words */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Pending Submissions ({pendingWords.length})
        </h2>
        {pendingWords.length === 0 ? (
          <p className="text-sm text-neutral-500">No pending submissions.</p>
        ) : (
          <div className="space-y-2">
            {pendingWords.map((word) => (
              <div
                key={word.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{word.foreign_word}</span>
                  <p className="text-sm text-neutral-500 truncate">
                    {word.definition}
                  </p>
                  <p className="text-xs text-neutral-400">
                    by {word.profiles.display_name}
                  </p>
                </div>
                <div className="flex gap-1 ml-3">
                  <button
                    onClick={() =>
                      handleAction("word_submission", word.id, "approve")
                    }
                    disabled={loading === word.id}
                    className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-500"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleAction("word_submission", word.id, "reject")
                    }
                    disabled={loading === word.id}
                    className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending User Suggestions */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Pending User Suggestions ({pendingSuggestions.length})
        </h2>
        {pendingSuggestions.length === 0 ? (
          <p className="text-sm text-neutral-500">No pending suggestions.</p>
        ) : (
          <div className="space-y-2">
            {pendingSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{sug.suggested_word}</span>
                  {sug.reasoning && (
                    <p className="text-sm text-neutral-500 truncate">
                      {sug.reasoning}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400">
                    by {sug.profiles.display_name}
                  </p>
                </div>
                <div className="flex gap-1 ml-3">
                  <button
                    onClick={() =>
                      handleAction("user_suggestion", sug.id, "approve")
                    }
                    disabled={loading === sug.id}
                    className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-500"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleAction("user_suggestion", sug.id, "reject")
                    }
                    disabled={loading === sug.id}
                    className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
