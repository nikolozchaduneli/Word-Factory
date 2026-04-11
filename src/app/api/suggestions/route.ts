import { createClient } from "@/lib/supabase/server";
import { userSuggestionSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = userSuggestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_suggestions")
    .insert({
      user_id: user.id,
      word_submission_id: parsed.data.word_submission_id,
      suggested_word: parsed.data.suggested_word,
      transliteration: parsed.data.transliteration ?? null,
      reasoning: parsed.data.reasoning ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[API:suggestions/POST]", error.message);
    return NextResponse.json(
      { error: "An internal error occurred. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
