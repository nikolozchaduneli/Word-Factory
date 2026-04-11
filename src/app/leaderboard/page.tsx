import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [{ data: topSuggestions }, { data: topContributors }] =
    await Promise.all([
      supabase
        .from("ai_suggestions")
        .select(
          "id, suggested_word, transliteration, score, word_submission_id, word_submissions!inner(foreign_word)"
        )
        .order("score", { ascending: false })
        .limit(20),
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .limit(20),
    ]);

  // Get submission counts for contributors
  const contributorIds = topContributors?.map((c) => c.id) ?? [];
  let contributorCounts: Record<string, number> = {};
  if (contributorIds.length > 0) {
    const { data: counts } = await supabase
      .from("word_submissions")
      .select("user_id")
      .in("user_id", contributorIds);

    if (counts) {
      contributorCounts = counts.reduce(
        (acc, row) => {
          acc[row.user_id] = (acc[row.user_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }
  }

  const sortedContributors = (topContributors ?? [])
    .map((c) => ({ ...c, count: contributorCounts[c.id] ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Leaderboard</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold mb-4">Top Neologisms</h2>
          {!topSuggestions || topSuggestions.length === 0 ? (
            <p className="text-sm text-zinc-500">No suggestions yet.</p>
          ) : (
            <div className="space-y-2">
              {topSuggestions.map((sug, i) => {
                const wordSubmission = sug.word_submissions as unknown as {
                  foreign_word: string;
                };
                return (
                  <a
                    key={sug.id}
                    href={`/words/${sug.word_submission_id}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">
                        {sug.suggested_word}
                      </span>
                      {sug.transliteration && (
                        <span className="ml-1 text-xs text-zinc-400">
                          ({sug.transliteration})
                        </span>
                      )}
                      <p className="text-xs text-zinc-500 truncate">
                        for &ldquo;{wordSubmission.foreign_word}&rdquo;
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        sug.score > 0
                          ? "text-green-600"
                          : sug.score < 0
                            ? "text-red-600"
                            : "text-zinc-400"
                      }`}
                    >
                      {sug.score > 0 ? "+" : ""}
                      {sug.score}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Top Contributors</h2>
          {sortedContributors.length === 0 ? (
            <p className="text-sm text-zinc-500">No contributors yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedContributors.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    {c.avatar_url && (
                      <img
                        src={c.avatar_url}
                        alt=""
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {c.display_name}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {c.count} word{c.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
