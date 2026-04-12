import { createClient } from "@/lib/supabase/server";
import { wordSubmissionSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { safeErrorResponse } from "@/lib/api-error";
import { TARGET_LANG } from "@/lib/language";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(supabase, user.id, "submission");
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const body = await request.json();
  const parsed = wordSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("word_submissions")
    .insert({
      user_id: user.id,
      foreign_word: parsed.data.foreign_word.charAt(0).toUpperCase() + parsed.data.foreign_word.slice(1),
      source_language: parsed.data.source_language,
      target_language: TARGET_LANG.code,
      definition: parsed.data.definition,
      context_example: parsed.data.context_example ?? null,
    })
    .select()
    .single();

  if (error) {
    return safeErrorResponse(error, "words/POST");
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Math.min(Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20), 50);
  const search = (searchParams.get("search") ?? "").slice(0, 200);
  const sort = searchParams.get("sort") ?? "newest";

  const offset = (page - 1) * limit;

  // Guard against absurdly large offsets (DoS via huge page numbers)
  if (offset > 10000) {
    return NextResponse.json(
      { error: "Page number too large" },
      { status: 400 }
    );
  }

  let query = supabase
    .from("word_submissions")
    .select("*, profiles!inner(display_name, avatar_url)", { count: "exact" })
    .eq("status", "approved")
    .eq("target_language", TARGET_LANG.code);

  if (search) {
    // Escape ILIKE wildcards and PostgREST filter metacharacters
    const escaped = search
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_")
      .replace(/[(),]/g, "");
    query = query.or(
      `foreign_word.ilike.%${escaped}%,definition.ilike.%${escaped}%`
    );
  }

  if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return safeErrorResponse(error, "words/GET");
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
