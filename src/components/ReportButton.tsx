"use client";

import { useState } from "react";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "offensive", label: "Offensive" },
  { value: "duplicate", label: "Duplicate" },
  { value: "low_quality", label: "Low Quality" },
  { value: "other", label: "Other" },
];

export default function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "word_submission" | "ai_suggestion" | "user_suggestion";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    await fetch("/api/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_type: targetType,
        target_id: targetId,
        reason: formData.get("reason"),
        description: formData.get("description") || undefined,
      }),
    });

    setLoading(false);
    setOpen(false);
    setDone(true);
  };

  if (done) {
    return <span className="text-xs text-zinc-400">Reported</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-400 hover:text-red-500"
        title="Report"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path
            fillRule="evenodd"
            d="M3 2a1 1 0 0 0-1 1v9.586l2-2V3h12v7a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1H3Zm0 16a1 1 0 0 1-.707-1.707L4.586 14H14a1 1 0 0 0 .707-.293l3-3A1 1 0 0 0 16.293 9.293L13.586 12H4a1 1 0 0 0-.707.293l-3 3A1 1 0 0 0 0 16v1a1 1 0 0 0 1 1h2Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleReport}
      className="absolute right-0 top-8 z-10 w-56 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
    >
      <select
        name="reason"
        required
        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <input
        name="description"
        placeholder="Details (optional)"
        className="mt-2 w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
      />
      <div className="mt-2 flex gap-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500"
        >
          Report
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded bg-zinc-200 px-2 py-1 text-xs dark:bg-zinc-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
