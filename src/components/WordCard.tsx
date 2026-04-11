import type { WordSubmissionWithProfile } from "@/types/database";

export default function WordCard({ word }: { word: WordSubmissionWithProfile }) {
  return (
    <a
      href={`/words/${word.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg">{word.foreign_word}</h3>
          <span className="text-xs text-zinc-400 uppercase">
            {word.source_language}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
        {word.definition}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
        {word.profiles?.avatar_url && (
          <img
            src={word.profiles.avatar_url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-5 w-5 rounded-full"
          />
        )}
        <span>{word.profiles?.display_name ?? "Anonymous"}</span>
        <span>-</span>
        <span>{new Date(word.created_at).toLocaleDateString()}</span>
      </div>
    </a>
  );
}
