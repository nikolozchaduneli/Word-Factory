import { createClient } from "@/lib/supabase/server";
import ModerationQueue from "@/components/ModerationQueue";

export default async function ModerationPage() {
  const supabase = await createClient();

  const [{ data: flags }, { data: pendingWords }, { data: pendingSuggestions }] =
    await Promise.all([
      supabase
        .from("moderation_flags")
        .select("*, profiles!reporter_id(display_name)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("word_submissions")
        .select("*, profiles!inner(display_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_suggestions")
        .select("*, profiles!inner(display_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Moderation Queue</h1>
      <ModerationQueue
        flags={flags ?? []}
        pendingWords={pendingWords ?? []}
        pendingSuggestions={pendingSuggestions ?? []}
      />
    </div>
  );
}
