import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.length < 32) {
    console.error("[CRON] CRON_SECRET is missing or too short (min 32 chars)");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Reset all users' daily token usage
  const { error } = await supabase
    .from("profiles")
    .update({
      tokens_used_today: 0,
      tokens_reset_at: new Date().toISOString(),
    })
    .gte("tokens_used_today", 1); // Only update users who actually used tokens

  if (error) {
    console.error("[CRON] daily-reset failed:", error.message);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again later." },
      { status: 500 }
    );
  }

  // Clean up old rate limit entries (older than 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("rate_limits")
    .delete()
    .lt("window_start", oneDayAgo);

  return NextResponse.json({ success: true, reset_at: new Date().toISOString() });
}

// Also handle GET for Vercel Cron (which sends GET requests)
export async function GET(request: Request) {
  return POST(request);
}
