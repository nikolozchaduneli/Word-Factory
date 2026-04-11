import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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
