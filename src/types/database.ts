export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "user" | "moderator" | "admin";
  daily_token_budget: number;
  tokens_used_today: number;
  tokens_reset_at: string;
  created_at: string;
  updated_at: string;
};

export type WordSubmission = {
  id: string;
  user_id: string;
  foreign_word: string;
  source_language: string;
  definition: string;
  context_example: string | null;
  status: "pending" | "approved" | "rejected" | "duplicate";
  duplicate_of: string | null;
  created_at: string;
  updated_at: string;
};

export type AiSuggestion = {
  id: string;
  word_submission_id: string;
  suggested_word: string;
  transliteration: string | null;
  etymology: string;
  score: number;
  tokens_used: number;
  model_version: string;
  created_at: string;
};

export type Vote = {
  id: string;
  user_id: string;
  suggestion_id: string;
  vote_type: -1 | 1;
  created_at: string;
};

export type UserSuggestion = {
  id: string;
  word_submission_id: string;
  user_id: string;
  suggested_word: string;
  transliteration: string | null;
  reasoning: string | null;
  score: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type ModerationFlag = {
  id: string;
  reporter_id: string;
  target_type: "word_submission" | "ai_suggestion" | "user_suggestion";
  target_id: string;
  reason: "spam" | "offensive" | "duplicate" | "low_quality" | "other";
  description: string | null;
  status: "open" | "resolved" | "dismissed";
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type WordSubmissionWithProfile = WordSubmission & {
  profiles: Pick<Profile, "display_name" | "avatar_url">;
};

export type AiSuggestionWithVote = AiSuggestion & {
  user_vote?: Vote | null;
};
