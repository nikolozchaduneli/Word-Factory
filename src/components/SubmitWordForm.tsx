"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TARGET_LANG } from "@/lib/language";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "pt", label: "Portuguese" },
  { value: "tr", label: "Turkish" },
  { value: "other", label: "Other" },
];

type SimilarWord = {
  id: string;
  foreign_word: string;
  similarity?: number;
};

export default function SubmitWordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [foreignWord, setForeignWord] = useState("");
  const [language, setLanguage] = useState("en");
  const [definition, setDefinition] = useState("");
  const [similarWords, setSimilarWords] = useState<SimilarWord[]>([]);
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const [dictSuggestions, setDictSuggestions] = useState<string[]>([]);
  const [dictLoading, setDictLoading] = useState(false);

  const checkDuplicates = useCallback(async (word: string) => {
    if (word.length < 2) {
      setSimilarWords([]);
      return;
    }
    const res = await fetch(
      `/api/words/similar?word=${encodeURIComponent(word)}`
    );
    if (res.ok) {
      const { data } = await res.json();
      setSimilarWords(data ?? []);
    }
  }, []);

  const fetchDefinitions = useCallback(async (word: string, lang: string) => {
    if (word.length < 2) {
      setDictSuggestions([]);
      return;
    }

    const langMap: Record<string, string> = {
      en: "en",
      de: "de",
      fr: "fr",
      es: "es",
      it: "it",
      pt: "pt",
      ru: "ru",
      ar: "ar",
      tr: "tr",
    };

    const dictLang = langMap[lang];
    if (!dictLang) {
      setDictSuggestions([]);
      return;
    }

    setDictLoading(true);
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/${dictLang}/${encodeURIComponent(word)}`
      );
      if (res.ok) {
        const data = await res.json();
        const defs: string[] = [];
        for (const entry of data) {
          for (const meaning of entry.meanings ?? []) {
            for (const def of meaning.definitions ?? []) {
              if (def.definition && defs.length < 5) {
                const prefix = meaning.partOfSpeech ? `(${meaning.partOfSpeech}) ` : "";
                defs.push(prefix + def.definition);
              }
            }
          }
        }
        setDictSuggestions(defs);
      } else {
        setDictSuggestions([]);
      }
    } catch {
      setDictSuggestions([]);
    }
    setDictLoading(false);
  }, []);

  useEffect(() => {
    setDuplicateAcknowledged(false);
    const timeout = setTimeout(() => {
      checkDuplicates(foreignWord);
      fetchDefinitions(foreignWord, language);
    }, 400);
    return () => clearTimeout(timeout);
  }, [foreignWord, language, checkDuplicates, fetchDefinitions]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (similarWords.length > 0 && !duplicateAcknowledged) {
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const body = {
      foreign_word: foreignWord,
      source_language: language,
      definition,
      context_example: formData.get("context_example") || undefined,
    };

    const res = await fetch("/api/words", {
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

    const data = await res.json();
    router.push(`/words/${data.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="foreign_word"
          className="block text-sm font-medium mb-1"
        >
          Foreign Word or Phrase *
        </label>
        <input
          type="text"
          id="foreign_word"
          name="foreign_word"
          required
          maxLength={100}
          value={foreignWord}
          onChange={(e) => setForeignWord(e.target.value)}
          placeholder="e.g. Serendipity"
          className="au-input w-full px-3 py-2 text-sm"
        />

        {similarWords.length > 0 && (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/30">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Similar words already exist:
            </p>
            <ul className="mt-1 space-y-1">
              {similarWords.map((w) => (
                <li key={w.id} className="text-sm">
                  <a
                    href={`/words/${w.id}`}
                    className="text-amber-700 underline dark:text-amber-400"
                    target="_blank"
                  >
                    {w.foreign_word}
                  </a>
                  {w.similarity && (
                    <span className="ml-1 text-xs text-amber-600 dark:text-amber-500">
                      ({Math.round(w.similarity * 100)}% match)
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <label className="mt-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <input
                type="checkbox"
                checked={duplicateAcknowledged}
                onChange={(e) => setDuplicateAcknowledged(e.target.checked)}
                className="rounded"
              />
              I&apos;ve checked and this is a different concept
            </label>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="source_language"
          className="block text-sm font-medium mb-1"
        >
          Source Language *
        </label>
        <select
          id="source_language"
          name="source_language"
          required
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="au-input w-full px-3 py-2 text-sm"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="definition" className="block text-sm font-medium mb-1">
          What does this word/concept mean? *
        </label>
        <textarea
          id="definition"
          name="definition"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder={TARGET_LANG.ui.submitPlaceholder}
          className="au-input w-full px-3 py-2 text-sm"
        />

        {dictLoading && (
          <p className="mt-1 text-xs au-text-muted">Looking up definition...</p>
        )}

        {dictSuggestions.length > 0 && !definition && (
          <div className="mt-2 space-y-1">
            <p className="text-xs au-text-secondary">Suggestions from dictionary:</p>
            {dictSuggestions.map((def, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDefinition(def);
                  setDictSuggestions([]);
                }}
                className="au-card au-card-hover block w-full px-3 py-2 text-left text-xs au-text-secondary"
              >
                {def}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="context_example"
          className="block text-sm font-medium mb-1"
        >
          Usage Example (optional)
        </label>
        <textarea
          id="context_example"
          name="context_example"
          maxLength={500}
          rows={2}
          placeholder="Provide a sentence showing how this word is used..."
          className="au-input w-full px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading || (similarWords.length > 0 && !duplicateAcknowledged)}
        className="au-btn-primary w-full px-4 py-2.5 text-sm"
      >
        {loading ? "Submitting..." : "Submit Word"}
      </button>
    </form>
  );
}
