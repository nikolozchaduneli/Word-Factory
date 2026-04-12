import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { WordSubmission, Profile } from "@/types/database";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: submissions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Profile>(),
    supabase
      .from("word_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<WordSubmission[]>(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {profile?.display_name ?? "Anonymous"}
          </h1>
          <p className="text-sm au-text-muted">
            Member since{" "}
            {new Date(profile?.created_at ?? "").toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">
          Your Submissions ({submissions?.length ?? 0})
        </h2>

        {!submissions || submissions.length === 0 ? (
          <div className="au-card p-8 text-center">
            <p className="au-text-muted">
              You haven&apos;t submitted any words yet.
            </p>
            <a
              href="/words/new"
              className="mt-3 inline-block text-sm font-medium underline"
              style={{ color: "var(--primary)" }}
            >
              Submit your first word
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <a
                key={sub.id}
                href={`/words/${sub.id}`}
                className="au-card au-card-hover block p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium">{sub.foreign_word}</span>
                    <span className="ml-2 text-xs au-text-muted">
                      {sub.source_language}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.status === "approved"
                        ? "au-status-approved"
                        : sub.status === "pending"
                          ? "au-status-pending"
                          : "au-status-rejected"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
                <p className="mt-1 text-sm au-text-secondary line-clamp-2">
                  {sub.definition}
                </p>
                <p className="mt-2 text-xs au-text-muted">
                  {new Date(sub.created_at).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
