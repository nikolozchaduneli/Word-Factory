"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setQuery(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
        params.delete("page");
      } else {
        params.delete("search");
      }
      router.push(`/words?${params.toString()}`);
    }, 400);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Search words or definitions..."
      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 dark:border-white/[0.12] dark:bg-white/[0.06] dark:focus:border-[#5E6AD2] dark:focus:ring-[#5E6AD2]/20 transition-all"
    />
  );
}
