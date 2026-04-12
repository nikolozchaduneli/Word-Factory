import { createClient } from "@/lib/supabase/server";
import { TARGET_LANG } from "@/lib/language";

export default async function Home() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("word_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("target_language", TARGET_LANG.code);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.25em] au-text-muted">
            A living lexicon
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            Word Factory
          </h1>
        </div>
        <p className="text-lg sm:text-xl au-text-secondary max-w-xl mx-auto leading-relaxed">
          {TARGET_LANG.ui.heroText}
        </p>

        {count !== null && count > 0 && (
          <p className="text-sm au-text-muted">
            {count} word{count !== 1 ? "s" : ""} submitted so far
          </p>
        )}

        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
          <a
            href="/words"
            className="au-btn-primary px-6 py-3 text-sm"
          >
            Browse Words
          </a>
          <a
            href="/words/new"
            className="au-btn-ghost px-6 py-3 text-sm"
          >
            Submit a Word
          </a>
        </div>
      </div>
    </div>
  );
}
