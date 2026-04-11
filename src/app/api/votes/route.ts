import { createClient } from "@/lib/supabase/server";
import { voteSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
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

  const rateLimit = await checkRateLimit(supabase, user.id, "vote");
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const body = await request.json();
  const parsed = voteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { suggestion_id, vote_type } = parsed.data;

  // Atomic vote upsert to prevent race conditions
  const { data, error } = await supabase.rpc("upsert_vote", {
    p_user_id: user.id,
    p_suggestion_id: suggestion_id,
    p_vote_type: vote_type,
  });

  if (error) {
    return safeErrorResponse(error, "votes/POST");
  }

  const result = data?.[0];
  const action = result?.action ?? "created";
  const status = action === "created" ? 201 : 200;

  return NextResponse.json({ action, vote_type }, { status });
}
