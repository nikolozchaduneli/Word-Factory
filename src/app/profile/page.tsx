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
          <p className="text-sm text-neutral-500">
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
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-white/[0.1] dark:bg-white/[0.06] dark:backdrop-blur-md">
            <p className="text-neutral-500">
              You haven&apos;t submitted any words yet.
            </p>
            <a
              href="/words/new"
              className="mt-3 inline-block text-sm font-medium text-[#5E6AD2] underline dark:text-[#818CF8]"
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
                className="block rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-white/[0.1] dark:bg-white/[0.06] dark:backdrop-blur-md dark:hover:border-[#5E6AD2]/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium">{sub.foreign_word}</span>
                    <span className="ml-2 text-xs text-neutral-400">
                      {sub.source_language}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.status === "approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : sub.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {sub.definition}
                </p>
                <p className="mt-2 text-xs text-neutral-400">
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
