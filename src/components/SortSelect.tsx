"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "newest";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");
    router.push(`/words?${params.toString()}`);
  };

  return (
    <select
      value={sort}
      onChange={(e) => handleChange(e.target.value)}
      className="appearance-none rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]/30 dark:border-white/[0.12] dark:bg-white/[0.06] dark:focus:border-[#5E6AD2] dark:focus:ring-[#5E6AD2]/20 transition-all"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.5rem center",
      }}
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
    </select>
  );
}
