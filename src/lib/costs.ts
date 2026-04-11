import { SupabaseClient } from "@supabase/supabase-js";

type BudgetResult = {
  allowed: boolean;
  remaining: number;
  dailyBudget: number;
};

export async function checkUserBudget(
  supabase: SupabaseClient,
  userId: string
): Promise<BudgetResult> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_token_budget, tokens_used_today")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { allowed: false, remaining: 0, dailyBudget: 0 };
  }

  const remaining = profile.daily_token_budget - profile.tokens_used_today;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    dailyBudget: profile.daily_token_budget,
  };
}

export async function recordTokenUsage(
  supabase: SupabaseClient,
  userId: string,
  tokensUsed: number
): Promise<void> {
  // Atomic increment to prevent lost updates under concurrency
  const { error: tokenError } = await supabase.rpc("increment_tokens_used", {
    p_user_id: userId,
    p_tokens: tokensUsed,
  });

  if (tokenError) {
    console.error("[costs] Failed to increment tokens:", tokenError.message);
  }

  // Atomic monthly spend upsert to prevent race conditions
  const monthYear = new Date().toISOString().slice(0, 7); // e.g. "2026-04"
  const costCents = Math.ceil(tokensUsed * 0.0003); // rough estimate

  const { error: spendError } = await supabase.rpc("record_monthly_spend", {
    p_month_year: monthYear,
    p_tokens: tokensUsed,
    p_cost_cents: costCents,
  });

  if (spendError) {
    console.error("[costs] Failed to record monthly spend:", spendError.message);
  }
}

export async function checkMonthlySpendCap(
  supabase: SupabaseClient
): Promise<{ allowed: boolean; usedCents: number; capCents: number }> {
  const monthYear = new Date().toISOString().slice(0, 7);

  const { data } = await supabase
    .from("monthly_spend")
    .select("total_cost_cents, cap_cents")
    .eq("month_year", monthYear)
    .single();

  if (!data) {
    return { allowed: true, usedCents: 0, capCents: 2000 };
  }

  return {
    allowed: data.total_cost_cents < data.cap_cents,
    usedCents: data.total_cost_cents,
    capCents: data.cap_cents,
  };
}
