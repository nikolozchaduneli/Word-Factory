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
        className="text-sm font-medium text-[#5E6AD2] hover:text-[#6872D9] dark:text-[#818CF8]"
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
      className="rounded-lg border border-neutral-200 bg-white p-4 space-y-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
    >
      <h3 className="text-sm font-semibold">{TARGET_LANG.ui.proposeHeading}</h3>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <input
        type="text"
        name="suggested_word"
        required
        placeholder={TARGET_LANG.ui.proposePlaceholder}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-[#5E6AD2] transition-all"
      />
      <input
        type="text"
        name="transliteration"
        placeholder="Transliteration (Latin script)"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-[#5E6AD2] transition-all"
      />
      <textarea
        name="reasoning"
        rows={2}
        placeholder="Why does this word work? (optional)"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 dark:border-white/[0.08] dark:bg-white/[0.03] dark:focus:border-[#5E6AD2] transition-all"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#5E6AD2] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6872D9] disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:border-white/[0.1] dark:text-neutral-400 dark:hover:bg-white/[0.05]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
