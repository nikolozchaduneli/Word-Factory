import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { WordSubmission, Profile, AiSuggestion, Vote } from "@/types/database";
import SuggestionCard from "@/components/SuggestionCard";
import GenerateButton from "@/components/GenerateButton";
import VoteButtons from "@/components/VoteButtons";
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

  // Fetch user's votes for these suggestions
  let userVotes: Record<string, number> = {};
  if (user && suggestions && suggestions.length > 0) {
    const { data: votes } = await supabase
      .from("votes")
      .select("suggestion_id, vote_type")
      .eq("user_id", user.id)
      .in(
        "suggestion_id",
        suggestions.map((s) => s.id)
      )
      .returns<Pick<Vote, "suggestion_id" | "vote_type">[]>();

    if (votes) {
      userVotes = Object.fromEntries(
        votes.map((v) => [v.suggestion_id, v.vote_type])
      );
    }
  }

  const canGenerate = !!user && (suggestions?.length ?? 0) < 10;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <a
        href="/words"
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        &larr; Back to words
      </a>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{word.foreign_word}</h1>
            <span className="text-sm text-zinc-400 uppercase">
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

        <p className="mt-4 text-zinc-700 dark:text-zinc-300">
          {word.definition}
        </p>

        {word.context_example && (
          <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
            <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
              &ldquo;{word.context_example}&rdquo;
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          {word.profiles?.avatar_url && (
            <img
              src={word.profiles.avatar_url}
              alt=""
              className="h-6 w-6 rounded-full"
            />
          )}
          <span>{word.profiles?.display_name}</span>
          <span>-</span>
          <span>{new Date(word.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Georgian Suggestions ({suggestions?.length ?? 0})
          </h2>
          {canGenerate && <GenerateButton wordSubmissionId={word.id} />}
        </div>

        {!suggestions || suggestions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-zinc-500 mb-3">
              No suggestions yet.
            </p>
            {canGenerate && (
              <GenerateButton wordSubmissionId={word.id} />
            )}
            {!user && (
              <p className="text-sm text-zinc-400 mt-2">
                <a href="/login" className="underline">Sign in</a> to generate AI suggestions
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((sug) => (
              <SuggestionCard key={sug.id} suggestion={sug}>
                {user ? (
                  <VoteButtons
                    suggestionId={sug.id}
                    initialScore={sug.score}
                    initialVote={userVotes[sug.id] ?? null}
                  />
                ) : (
                  <span className="text-sm font-medium text-zinc-500">
                    {sug.score > 0 ? "+" : ""}{sug.score}
                  </span>
                )}
              </SuggestionCard>
            ))}
          </div>
        )}
      </section>

      {user && (
        <section className="mt-6">
          <ProposeForm wordSubmissionId={word.id} />
        </section>
      )}
    </div>
  );
}
