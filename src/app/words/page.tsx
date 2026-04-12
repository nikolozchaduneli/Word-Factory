import { createClient } from "@/lib/supabase/server";
import WordCard from "@/components/WordCard";
import SearchBar from "@/components/SearchBar";
import type { WordSubmissionWithProfile } from "@/types/database";
import SortSelect from "@/components/SortSelect";
import { TARGET_LANG } from "@/lib/language";
import { Suspense } from "react";

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const limit = 20;
  const search = params.search ?? "";
  const sort = params.sort ?? "newest";
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from("word_submissions")
    .select("*, profiles!inner(display_name, avatar_url)", { count: "exact" })
    .eq("status", "approved")
    .eq("target_language", TARGET_LANG.code);

  if (search) {
    query = query.or(
      `foreign_word.ilike.%${search}%,definition.ilike.%${search}%`
    );
  }

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: words, count } = await query.range(
    offset,
    offset + limit - 1
  );

  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Browse Words</h1>
        <a
          href="/words/new"
          className="au-btn-primary px-4 py-2 text-sm"
        >
          Submit Word
        </a>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="flex-1">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>

      {!words || words.length === 0 ? (
        <div className="au-card p-12 text-center">
          <p className="au-text-muted">
            {search
              ? `No words found matching "${search}"`
              : "No words submitted yet. Be the first!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(words as WordSubmissionWithProfile[]).map((word) => (
            <WordCard key={word.id} word={word} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/words?page=${page - 1}${search ? `&search=${search}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}`}
              className="au-btn-ghost px-3 py-1.5 text-sm"
            >
              Previous
            </a>
          )}
          <span className="text-sm au-text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/words?page=${page + 1}${search ? `&search=${search}` : ""}${sort !== "newest" ? `&sort=${sort}` : ""}`}
              className="au-btn-ghost px-3 py-1.5 text-sm"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
