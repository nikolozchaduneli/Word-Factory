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
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Word Factory
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          {TARGET_LANG.ui.heroText}
        </p>

        {count !== null && count > 0 && (
          <p className="text-sm text-zinc-500">
            {count} word{count !== 1 ? "s" : ""} submitted so far
          </p>
        )}

        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
          <a
            href="/words"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Browse Words
          </a>
          <a
            href="/words/new"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Submit a Word
          </a>
        </div>
      </div>
    </div>
  );
}
