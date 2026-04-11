import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateFromAllModels } from "@/lib/ai";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkUserBudget, checkMonthlySpendCap, recordTokenUsage } from "@/lib/costs";
import { safeErrorResponse } from "@/lib/api-error";
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

  const budget = await checkUserBudget(supabase, user.id);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: "Daily token budget exhausted. Try again tomorrow." },
      { status: 429 },
    );
  }

  const monthlySpend = await checkMonthlySpendCap(supabase);
  if (!monthlySpend.allowed) {
    return NextResponse.json(
      { error: "Monthly AI budget cap reached. Please try again next month." },
      { status: 429 },
    );
  }

  const { wordSubmissionId } = await request.json();

  if (!wordSubmissionId) {
    return NextResponse.json(
      { error: "wordSubmissionId is required" },
      { status: 400 },
    );
  }

  const { data: word } = await supabase
    .from("word_submissions")
    .select("*")
    .eq("id", wordSubmissionId)
    .single();

  if (!word) {
    return NextResponse.json(
      { error: "Word submission not found" },
      { status: 404 },
    );
  }

  // Security: only allow AI generation on approved words or user's own submissions
  if (word.status !== "approved" && word.user_id !== user.id) {
    return NextResponse.json(
      { error: "Word submission not found" },
      { status: 404 },
    );
  }

  const { count } = await supabase
    .from("ai_suggestions")
    .select("*", { count: "exact", head: true })
    .eq("word_submission_id", wordSubmissionId);

  if ((count ?? 0) >= 30) {
    return NextResponse.json(
      { error: "Maximum AI suggestions reached for this word" },
      { status: 429 },
    );
  }

  try {
    const modelResults = await generateFromAllModels(
      word.foreign_word,
      word.definition,
      word.context_example,
    );

    if (modelResults.length === 0) {
      return NextResponse.json(
        { error: "No AI models available. Check API key configuration." },
        { status: 503 },
      );
    }

    const adminClient = createAdminClient();
    const allInserted = [];
    let successTokens = 0;
    let insertErrors = 0;

    for (const result of modelResults) {
      const { data: inserted, error } = await adminClient
        .from("ai_suggestions")
        .insert(
          result.suggestions.map((s) => ({
            word_submission_id: wordSubmissionId,
            suggested_word: s.suggested_word,
            transliteration: s.transliteration,
            etymology: s.etymology,
            tokens_used: Math.ceil(result.tokensUsed / result.suggestions.length),
            model_version: result.provider,
          })),
        )
        .select();

      if (error) {
        console.error(`[AI] Insert failed for ${result.provider}:`, error.message);
        insertErrors++;
      } else if (inserted) {
        allInserted.push(...inserted);
        successTokens += result.tokensUsed;
      }
    }

    if (successTokens > 0) {
      await recordTokenUsage(supabase, user.id, successTokens);
    }

    if (allInserted.length === 0 && insertErrors > 0) {
      return NextResponse.json(
        { error: "Failed to save AI suggestions" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: allInserted });
  } catch (err) {
    return safeErrorResponse(err, "ai/suggest");
  }
}
