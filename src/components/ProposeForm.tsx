"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TARGET_LANG } from "@/lib/language";

export default function ProposeForm({
  wordSubmissionId,
}: {
  wordSubmissionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium transition-colors"
        style={{ color: "var(--primary)" }}
      >
        {TARGET_LANG.ui.proposeButton}
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      word_submission_id: wordSubmissionId,
      suggested_word: formData.get("suggested_word"),
      transliteration: formData.get("transliteration") || undefined,
      reasoning: formData.get("reasoning") || undefined,
    };

    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="au-card p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold">{TARGET_LANG.ui.proposeHeading}</h3>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <input
        type="text"
        name="suggested_word"
        required
        placeholder={TARGET_LANG.ui.proposePlaceholder}
        className="au-input w-full px-3 py-2 text-sm"
      />
      <input
        type="text"
        name="transliteration"
        placeholder="Transliteration (Latin script)"
        className="au-input w-full px-3 py-2 text-sm"
      />
      <textarea
        name="reasoning"
        rows={2}
        placeholder="Why does this word work? (optional)"
        className="au-input w-full px-3 py-2 text-sm"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="au-btn-primary px-3 py-1.5 text-sm"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="au-btn-ghost px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
