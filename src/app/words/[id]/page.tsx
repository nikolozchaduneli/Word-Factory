import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { WordSubmission, Profile, AiSuggestion, Vote } from "@/types/database";
import SuggestionsSection from "@/components/SuggestionsSection";
import ProposeForm from "@/components/ProposeForm";

type WordWithProfile = WordSubmission & {
  profiles: Pick<Profile, "display_name" | "avatar_url">;
};

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: word }, { data: suggestions }, { data: { user } }] =
    await Promise.all([
      supabase
        .from("word_submissions")
        .select("*, profiles!inner(display_name, avatar_url)")
        .eq("id", id)
        .single<WordWithProfile>(),
      supabase
        .from("ai_suggestions")
        .select("*")
        .eq("word_submission_id", id)
        .order("score", { ascending: false })
        .returns<AiSuggestion[]>(),
      supabase.auth.getUser(),
    ]);

  if (!word) {
    notFound();
  }

  let userVotes: Record<string, number> = {};
  if (user && suggestions && suggestions.length > 0) {
    const { data: votes } = await supabase
      .from("votes")
      .select("suggestion_id, vote_type")
      .eq("user_id", user.id)
      .in(
        "suggestion_id",
        suggestions.map((s) => s.id),
      )
      .returns<Pick<Vote, "suggestion_id" | "vote_type">[]>();

    if (votes) {
      userVotes = Object.fromEntries(
        votes.map((v) => [v.suggestion_id, v.vote_type]),
      );
    }
  }

  const canGenerate = !!user && (suggestions?.length ?? 0) < 30;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <a
        href="/words"
        className="text-sm au-text-muted hover:text-[var(--text-secondary)] transition-colors"
      >
        &larr; Back to words
      </a>

      <div className="au-card mt-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{word.foreign_word}</h1>
            <span className="text-sm au-text-muted uppercase">
              {word.source_language}
            </span>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
              word.status === "approved"
                ? "au-status-approved"
                : "au-status-pending"
            }`}
          >
            {word.status}
          </span>
        </div>

        <p className="mt-4" style={{ color: "var(--text)" }}>
          {word.definition}
        </p>

        {word.context_example && (
          <div className="mt-4 rounded-lg p-3" style={{ background: "var(--muted-bg)" }}>
            <p className="text-sm italic au-text-secondary">
              &ldquo;{word.context_example}&rdquo;
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm au-text-muted">
          {word.profiles?.avatar_url && (
            <img
              src={word.profiles.avatar_url}
              alt=""
              referrerPolicy="no-referrer"
              className="h-6 w-6 rounded-full"
            />
          )}
          <span>{word.profiles?.display_name}</span>
          <span>-</span>
          <span>{new Date(word.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <SuggestionsSection
        wordSubmissionId={word.id}
        isLoggedIn={!!user}
        suggestions={suggestions ?? []}
        userVotes={userVotes}
        canGenerate={canGenerate}
      />

      {user && (
        <section className="mt-6">
          <ProposeForm wordSubmissionId={word.id} />
        </section>
      )}
    </div>
  );
}
