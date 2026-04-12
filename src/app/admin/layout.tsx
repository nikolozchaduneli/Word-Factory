import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    redirect("/");
  }

  return (
    <div>
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl gap-4 px-4 py-2">
          <a
            href="/admin/moderation"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-[#8A8F98] dark:hover:text-white transition-colors"
          >
            Moderation
          </a>
          <a
            href="/admin/spend"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-[#8A8F98] dark:hover:text-white transition-colors"
          >
            Spend
          </a>
        </div>
      </div>
      {children}
    </div>
  );
}
