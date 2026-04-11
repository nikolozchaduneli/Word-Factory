import { SupabaseClient } from "@supabase/supabase-js";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

const LIMITS: Record<string, { maxRequests: number; windowMinutes: number }> = {
  submission: { maxRequests: 10, windowMinutes: 60 },
  ai_request: { maxRequests: 20, windowMinutes: 60 },
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

  const resetAt = new Date(
    Date.now() + config.windowMinutes * 60 * 1000
  );

  // Atomic check-and-record to prevent TOCTOU race condition
  const { data, error } = await supabase.rpc("check_and_record_rate_limit", {
    p_user_id: userId,
    p_action_type: actionType,
    p_max_requests: config.maxRequests,
    p_window_minutes: config.windowMinutes,
  });

  if (error || !data || data.length === 0) {
    // On RPC failure, fail open but log the error
    console.error("[rate-limit] RPC failed:", error?.message);
    return { allowed: true, remaining: 0, resetAt };
  }

  const result = data[0];
  const currentCount = Number(result.current_count);
  const remaining = Math.max(0, config.maxRequests - currentCount);

  return {
    allowed: result.allowed,
    remaining: result.allowed ? remaining - 1 : 0,
    resetAt,
  };
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
