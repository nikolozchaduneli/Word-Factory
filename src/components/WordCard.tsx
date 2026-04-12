import type { WordSubmissionWithProfile } from "@/types/database";

export default function WordCard({ word }: { word: WordSubmissionWithProfile }) {
  return (
    <a
      href={`/words/${word.id}`}
      className="block rounded-lg border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-sm dark:border-white/[0.1] dark:bg-white/[0.06] dark:backdrop-blur-md dark:hover:border-[#5E6AD2]/40 dark:hover:bg-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg">{word.foreign_word}</h3>
          <span className="text-xs text-neutral-400 dark:text-[#8A8F98] uppercase">
            {word.source_language}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-neutral-600 dark:text-[#8A8F98] line-clamp-2">
        {word.definition}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
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
