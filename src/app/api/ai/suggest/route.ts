import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNeologisms } from "@/lib/claude";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkUserBudget, checkMonthlySpendCap, recordTokenUsage } from "@/lib/costs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(supabase, user.id, "ai_request");
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  // Check user's daily token budget
  const budget = await checkUserBudget(supabase, user.id);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: "Daily token budget exhausted. Try again tomorrow." },
      { status: 429 }
    );
  }

  // Check monthly spend cap
  const monthlySpend = await checkMonthlySpendCap(supabase);
  if (!monthlySpend.allowed) {
    return NextResponse.json(
      { error: "Monthly AI budget cap reached. Please try again next month." },
      { status: 429 }
    );
  }

  const { wordSubmissionId } = await request.json();

  if (!wordSubmissionId) {
    return NextResponse.json(
      { error: "wordSubmissionId is required" },
      { status: 400 }
    );
  }

  // Fetch the word submission
  const { data: word } = await supabase
    .from("word_submissions")
    .select("*")
    .eq("id", wordSubmissionId)
    .single();

  if (!word) {
    return NextResponse.json(
      { error: "Word submission not found" },
      { status: 404 }
    );
  }

  // Check existing suggestion count
  const { count } = await supabase
    .from("ai_suggestions")
    .select("*", { count: "exact", head: true })
    .eq("word_submission_id", wordSubmissionId);

  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: "Maximum AI suggestions reached for this word" },
      { status: 429 }
    );
  }

  try {
    const { suggestions, tokensUsed } = await generateNeologisms(
      word.foreign_word,
      word.definition,
      word.context_example
    );

    // Insert suggestions using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const { data: inserted, error } = await adminClient
      .from("ai_suggestions")
      .insert(
        suggestions.map((s) => ({
          word_submission_id: wordSubmissionId,
          suggested_word: s.suggested_word,
          transliteration: s.transliteration,
          etymology: s.etymology,
          tokens_used: Math.ceil(tokensUsed / suggestions.length),
        }))
      )
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record token usage
    await recordTokenUsage(supabase, user.id, tokensUsed);

    return NextResponse.json({ data: inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
