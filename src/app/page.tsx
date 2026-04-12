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
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-24">
      {/* Aurora blobs */}
      <div className="aurora-blob w-[600px] h-[600px] bg-indigo-400/40 dark:bg-indigo-500/30 -top-48 -right-32" />
      <div className="aurora-blob w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-500/25 top-20 -left-48" style={{ animationDelay: "-4s" }} />
      <div className="aurora-blob w-[400px] h-[400px] bg-pink-400/25 dark:bg-pink-500/20 bottom-0 right-1/4" style={{ animationDelay: "-8s" }} />

      <div className="relative max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Word Factory
        </h1>
        <p className="text-xl text-neutral-600 dark:text-[#8A8F98]">
          {TARGET_LANG.ui.heroText}
        </p>

        {count !== null && count > 0 && (
          <p className="text-sm text-neutral-500 dark:text-[#8A8F98]">
            {count} word{count !== 1 ? "s" : ""} submitted so far
          </p>
        )}

        <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-center">
          <a
            href="/words"
            className="rounded-lg bg-[#5E6AD2] px-6 py-3 text-sm font-medium text-white shadow-[0_0_20px_rgba(94,106,210,0.3)] transition-all hover:bg-[#6872D9] hover:shadow-[0_0_30px_rgba(94,106,210,0.4)]"
          >
            Browse Words
          </a>
          <a
            href="/words/new"
            className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-100 dark:border-white/[0.1] dark:text-neutral-300 dark:hover:bg-white/[0.1]"
          >
            Submit a Word
          </a>
        </div>
      </div>
    </div>
  );
}
