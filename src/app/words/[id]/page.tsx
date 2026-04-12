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
        className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
      >
        &larr; Back to words
      </a>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6 dark:border-white/[0.1] dark:bg-white/[0.06] dark:backdrop-blur-md">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{word.foreign_word}</h1>
            <span className="text-sm text-neutral-400 dark:text-[#8A8F98] uppercase">
              {word.source_language}
            </span>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              word.status === "approved"
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
            }`}
          >
            {word.status}
          </span>
        </div>

        <p className="mt-4 text-neutral-700 dark:text-neutral-300">
          {word.definition}
        </p>

        {word.context_example && (
          <div className="mt-4 rounded-lg bg-neutral-50 p-3 dark:bg-white/[0.06]">
            <p className="text-sm italic text-neutral-600 dark:text-neutral-400">
              &ldquo;{word.context_example}&rdquo;
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
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
