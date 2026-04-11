"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateButton({
  wordSubmissionId,
}: {
  wordSubmissionId: string;
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

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate AI Suggestions"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
