import { createClient } from "@/lib/supabase/server";
import { flagSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

// POST: Report/flag content
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(supabase, user.id, "flag");
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const body = await request.json();
  const parsed = flagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("moderation_flags")
    .insert({
      reporter_id: user.id,
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id,
      reason: parsed.data.reason,
      description: parsed.data.description ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already flagged this content" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH: Admin actions (approve/reject/resolve/dismiss)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin/moderator role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { target_type, target_id, action } = await request.json();

  if (target_type === "flag") {
    const status = action === "resolve" ? "resolved" : "dismissed";
    await supabase
      .from("moderation_flags")
      .update({
        status,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", target_id);
  } else if (target_type === "word_submission") {
    const status = action === "approve" ? "approved" : "rejected";
    await supabase
      .from("word_submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", target_id);
  } else if (target_type === "user_suggestion") {
    const status = action === "approve" ? "approved" : "rejected";
    await supabase
      .from("user_suggestions")
      .update({ status })
      .eq("id", target_id);
  }

  return NextResponse.json({ success: true });
}
