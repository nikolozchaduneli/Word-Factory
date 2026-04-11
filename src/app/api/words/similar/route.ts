import { createClient } from "@/lib/supabase/server";
import { TARGET_LANG } from "@/lib/language";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");

  if (!word || word.length < 2 || word.length > 200) {
    return NextResponse.json({ data: [] });
  }

  const supabase = await createClient();

  // Use the find_similar_words database function (pg_trgm)
  const { data, error } = await supabase.rpc("find_similar_words", {
    search_term: word,
    threshold: 0.3,
    target_lang: TARGET_LANG.code,
  });

  if (error) {
    // Fallback to simple ILIKE if pg_trgm function isn't available yet
    const { data: fallbackData } = await supabase
      .from("word_submissions")
      .select("id, foreign_word")
      .ilike("foreign_word", `%${word}%`)
      .neq("status", "rejected")
      .eq("target_language", TARGET_LANG.code)
      .limit(5);

    return NextResponse.json({ data: fallbackData ?? [] });
  }

  return NextResponse.json({ data: data ?? [] });
}
