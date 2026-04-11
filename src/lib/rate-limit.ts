import { SupabaseClient } from "@supabase/supabase-js";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

const LIMITS: Record<string, { maxRequests: number; windowMinutes: number }> = {
  submission: { maxRequests: 10, windowMinutes: 60 },
  ai_request: { maxRequests: 3, windowMinutes: 60 },
  vote: { maxRequests: 60, windowMinutes: 1 },
  flag: { maxRequests: 5, windowMinutes: 60 },
};

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  actionType: string
): Promise<RateLimitResult> {
  const config = LIMITS[actionType];
  if (!config) {
    return { allowed: true, remaining: 999, resetAt: new Date() };
  }

  const windowStart = new Date(
    Date.now() - config.windowMinutes * 60 * 1000
  );

  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_type", actionType)
    .gte("window_start", windowStart.toISOString());

  const currentCount = count ?? 0;
  const remaining = Math.max(0, config.maxRequests - currentCount);
  const resetAt = new Date(
    windowStart.getTime() + config.windowMinutes * 60 * 1000
  );

  if (currentCount >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Record this request
  await supabase.from("rate_limits").insert({
    user_id: userId,
    action_type: actionType,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: remaining - 1, resetAt };
}

export function rateLimitResponse(resetAt: Date) {
  const retryAfter = Math.ceil(
    (resetAt.getTime() - Date.now()) / 1000
  );
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, retryAfter)),
      },
    }
  );
}
