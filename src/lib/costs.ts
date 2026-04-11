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
  // Update user's daily usage
  const { data: profile } = await supabase
    .from("profiles")
    .select("tokens_used_today")
    .eq("id", userId)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({
        tokens_used_today: profile.tokens_used_today + tokensUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  // Update monthly spend
  const monthYear = new Date().toISOString().slice(0, 7); // e.g. "2026-04"
  const costCents = Math.ceil(tokensUsed * 0.0003); // rough estimate

  const { data: existing } = await supabase
    .from("monthly_spend")
    .select("*")
    .eq("month_year", monthYear)
    .single();

  if (existing) {
    await supabase
      .from("monthly_spend")
      .update({
        total_tokens: existing.total_tokens + tokensUsed,
        total_cost_cents: existing.total_cost_cents + costCents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("monthly_spend").insert({
      month_year: monthYear,
      total_tokens: tokensUsed,
      total_cost_cents: costCents,
    });
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
