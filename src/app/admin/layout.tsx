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
      <div className="au-navbar">
        <div className="mx-auto flex max-w-5xl gap-4 px-4 py-2">
          <a
            href="/admin/moderation"
            className="text-sm font-medium au-text-secondary transition-colors hover:text-[var(--text)]"
          >
            Moderation
          </a>
          <a
            href="/admin/spend"
            className="text-sm font-medium au-text-secondary transition-colors hover:text-[var(--text)]"
          >
            Spend
          </a>
        </div>
      </div>
      {children}
    </div>
  );
}
