import { createClient } from "@/lib/supabase/server";
import { TARGET_LANG } from "@/lib/language";

const LANG_TO_COUNTRY: Record<string, string> = {
  en: "gb",
  de: "de",
  fr: "fr",
  es: "es",
  it: "it",
  ru: "ru",
  ja: "jp",
  ko: "kr",
  zh: "cn",
  ar: "sa",
  pt: "pt",
  tr: "tr",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [{ data: topSuggestions }, { data: topContributors }] =
    await Promise.all([
      supabase
        .from("ai_suggestions")
        .select(
          "id, suggested_word, transliteration, score, word_submission_id, word_submissions!inner(foreign_word, source_language, target_language)"
        )
        .eq("word_submissions.target_language", TARGET_LANG.code)
        .gt("score", 0)
        .order("score", { ascending: false })
        .limit(50),
      supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .limit(50),
    ]);

  // Get submission counts for contributors
  const contributorIds = topContributors?.map((c) => c.id) ?? [];
  let contributorCounts: Record<string, number> = {};
  if (contributorIds.length > 0) {
    const { data: counts } = await supabase
      .from("word_submissions")
      .select("user_id")
      .in("user_id", contributorIds)
      .eq("target_language", TARGET_LANG.code);

    if (counts) {
      contributorCounts = counts.reduce(
        (acc, row) => {
          acc[row.user_id] = (acc[row.user_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
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
            <p className="text-sm au-text-muted">
              No voted suggestions yet. Be the first to vote!
            </p>
          ) : (
            <div className="space-y-2">
              {topSuggestions.map((sug, i) => {
                const ws = sug.word_submissions as unknown as {
                  foreign_word: string;
                  source_language: string;
                };
                const countryCode = LANG_TO_COUNTRY[ws.source_language] || null;
                return (
                  <a
                    key={sug.id}
                    href={`/words/${sug.word_submission_id}`}
                    className="au-card au-card-hover flex items-center gap-3 p-3"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: "var(--muted-bg)", color: "var(--text-secondary)" }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">
                        {sug.suggested_word}
                      </span>
                      {sug.transliteration && (
                        <span className="ml-1 text-xs au-text-muted">
                          ({sug.transliteration})
                        </span>
                      )}
                      <p className="flex items-center gap-1 text-xs au-text-muted truncate">
                        {countryCode && (
                          <img
                            src={`https://flagcdn.com/w20/${countryCode}.png`}
                            alt={ws.source_language}
                            className="h-3 w-auto inline-block"
                          />
                        )}
                        {ws.foreign_word}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      +{sug.score}
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
            <p className="text-sm au-text-muted">No contributors yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedContributors.map((c, i) => (
                <div
                  key={c.id}
                  className="au-card flex items-center gap-3 p-3"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "var(--muted-bg)", color: "var(--text-secondary)" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    {c.avatar_url && (
                      <img
                        src={c.avatar_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {c.display_name}
                    </span>
                  </div>
                  <span className="text-sm au-text-muted">
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
