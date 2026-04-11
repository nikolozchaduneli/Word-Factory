import { createClient } from "@/lib/supabase/server";
import { voteSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
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

  // Check if user already voted on this suggestion
  const { data: existingVote } = await supabase
    .from("votes")
    .select("*")
    .eq("user_id", user.id)
    .eq("suggestion_id", suggestion_id)
    .single();

  if (existingVote) {
    if (existingVote.vote_type === vote_type) {
      // Same vote — remove it (toggle off)
      await supabase.from("votes").delete().eq("id", existingVote.id);
      return NextResponse.json({ action: "removed" });
    } else {
      // Different vote — update it
      await supabase
        .from("votes")
        .update({ vote_type })
        .eq("id", existingVote.id);
      return NextResponse.json({ action: "updated", vote_type });
    }
  }

  // New vote
  const { error } = await supabase.from("votes").insert({
    user_id: user.id,
    suggestion_id,
    vote_type,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: "created", vote_type }, { status: 201 });
}
