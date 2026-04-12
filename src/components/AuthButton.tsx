"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-white/[0.1]" />
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="rounded-lg bg-[#5E6AD2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6872D9]"
      >
        Sign In
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a href="/profile" className="flex items-center gap-2">
        {user.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-full"
          />
        )}
        <span className="text-sm font-medium">
          {user.user_metadata?.full_name ?? user.email}
        </span>
      </a>
      <button
        onClick={handleSignOut}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-white/[0.1] dark:text-neutral-400 dark:hover:bg-white/[0.1]"
      >
        Sign Out
      </button>
    </div>
  );
}
