import type { WordSubmissionWithProfile } from "@/types/database";

export default function WordCard({ word }: { word: WordSubmissionWithProfile }) {
  return (
    <a
      href={`/words/${word.id}`}
      className="au-card au-card-hover block p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg">{word.foreign_word}</h3>
          <span className="text-xs au-text-muted uppercase">
            {word.source_language}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm au-text-secondary line-clamp-2">
        {word.definition}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs au-text-muted">
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
