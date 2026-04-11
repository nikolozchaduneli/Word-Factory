import { z } from "zod/v4";

export const wordSubmissionSchema = z.object({
  foreign_word: z
    .string()
    .min(1, "Word is required")
    .max(100, "Word must be under 100 characters"),
  source_language: z
    .string()
    .min(1, "Source language is required")
    .max(50, "Language must be under 50 characters"),
  definition: z
    .string()
    .min(10, "Definition must be at least 10 characters")
    .max(1000, "Definition must be under 1000 characters"),
  context_example: z
    .string()
    .max(500, "Context example must be under 500 characters")
    .optional(),
});

export const userSuggestionSchema = z.object({
  word_submission_id: z.string().uuid(),
  suggested_word: z
    .string()
    .min(1, "Suggested word is required")
    .max(100, "Must be under 100 characters"),
  transliteration: z
    .string()
    .max(100, "Must be under 100 characters")
    .optional(),
  reasoning: z
    .string()
    .max(500, "Reasoning must be under 500 characters")
    .optional(),
});

export const voteSchema = z.object({
  suggestion_id: z.string().uuid(),
  vote_type: z.union([z.literal(1), z.literal(-1)]),
});

export const flagSchema = z.object({
  target_type: z.enum(["word_submission", "ai_suggestion", "user_suggestion"]),
  target_id: z.string().uuid(),
  reason: z.enum(["spam", "offensive", "duplicate", "low_quality", "other"]),
  description: z.string().max(500).optional(),
});

export type WordSubmissionInput = z.infer<typeof wordSubmissionSchema>;
export type UserSuggestionInput = z.infer<typeof userSuggestionSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type FlagInput = z.infer<typeof flagSchema>;
