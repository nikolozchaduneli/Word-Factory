-- Word Factory: Full database schema
-- Covers all 3 milestones: Auth & Submissions, AI Suggestions & Voting, Abuse Prevention

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  daily_token_budget  INT NOT NULL DEFAULT 5000,
  tokens_used_today   INT NOT NULL DEFAULT 0,
  tokens_reset_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- TABLE: word_submissions
-- ============================================================
CREATE TABLE word_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  foreign_word    TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'en',
  definition      TEXT NOT NULL,
  context_example TEXT,
  status          TEXT NOT NULL DEFAULT 'approved'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  duplicate_of    UUID REFERENCES word_submissions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_word_submissions_foreign_word_trgm
  ON word_submissions USING gin (foreign_word gin_trgm_ops);
CREATE INDEX idx_word_submissions_definition_trgm
  ON word_submissions USING gin (definition gin_trgm_ops);
CREATE INDEX idx_word_submissions_status ON word_submissions(status);
CREATE INDEX idx_word_submissions_user_id ON word_submissions(user_id);

-- ============================================================
-- TABLE: ai_suggestions
-- ============================================================
CREATE TABLE ai_suggestions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_submission_id  UUID NOT NULL REFERENCES word_submissions(id) ON DELETE CASCADE,
  suggested_word      TEXT NOT NULL,
  transliteration     TEXT,
  etymology           TEXT NOT NULL,
  score               INT NOT NULL DEFAULT 0,
  tokens_used         INT NOT NULL DEFAULT 0,
  model_version       TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_suggestions_word_id ON ai_suggestions(word_submission_id);
CREATE INDEX idx_ai_suggestions_score ON ai_suggestions(score DESC);
CREATE INDEX idx_ai_suggestions_suggested_trgm
  ON ai_suggestions USING gin (suggested_word gin_trgm_ops);

-- ============================================================
-- TABLE: votes
-- ============================================================
CREATE TABLE votes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suggestion_id   UUID NOT NULL REFERENCES ai_suggestions(id) ON DELETE CASCADE,
  vote_type       SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, suggestion_id)
);

CREATE INDEX idx_votes_suggestion_id ON votes(suggestion_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- ============================================================
-- TABLE: user_suggestions
-- ============================================================
CREATE TABLE user_suggestions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_submission_id  UUID NOT NULL REFERENCES word_submissions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suggested_word      TEXT NOT NULL,
  transliteration     TEXT,
  reasoning           TEXT,
  score               INT NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_suggestions_word_id ON user_suggestions(word_submission_id);
CREATE INDEX idx_user_suggestions_user_id ON user_suggestions(user_id);
CREATE INDEX idx_user_suggestions_score ON user_suggestions(score DESC);

-- ============================================================
-- TABLE: moderation_flags
-- ============================================================
CREATE TABLE moderation_flags (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL CHECK (target_type IN ('word_submission', 'ai_suggestion', 'user_suggestion')),
  target_id       UUID NOT NULL,
  reason          TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'duplicate', 'low_quality', 'other')),
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, target_type, target_id)
);

CREATE INDEX idx_moderation_flags_status ON moderation_flags(status);
CREATE INDEX idx_moderation_flags_target ON moderation_flags(target_type, target_id);

-- ============================================================
-- TABLE: rate_limits
-- ============================================================
CREATE TABLE rate_limits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type     TEXT NOT NULL CHECK (action_type IN ('submission', 'ai_request', 'vote', 'flag')),
  window_start    TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count   INT NOT NULL DEFAULT 1,
  UNIQUE(user_id, action_type, window_start)
);

CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action_type, window_start DESC);

-- ============================================================
-- TABLE: monthly_spend
-- ============================================================
CREATE TABLE monthly_spend (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year      TEXT NOT NULL UNIQUE,
  total_tokens    INT NOT NULL DEFAULT 0,
  total_cost_cents INT NOT NULL DEFAULT 0,
  cap_cents       INT NOT NULL DEFAULT 2000,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: auto-update ai_suggestions.score on vote changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_suggestion_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_suggestions
    SET score = (
      SELECT COALESCE(SUM(vote_type), 0)
      FROM votes
      WHERE suggestion_id = COALESCE(NEW.suggestion_id, OLD.suggestion_id)
    )
    WHERE id = COALESCE(NEW.suggestion_id, OLD.suggestion_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_votes_update_score
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_suggestion_score();

-- ============================================================
-- TRIGGER: auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Anonymous'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: fuzzy duplicate detection
-- ============================================================
CREATE OR REPLACE FUNCTION find_similar_words(search_term TEXT, threshold FLOAT DEFAULT 0.3)
RETURNS TABLE(id UUID, foreign_word TEXT, similarity FLOAT) AS $$
BEGIN
  RETURN QUERY
    SELECT ws.id, ws.foreign_word, similarity(ws.foreign_word, search_term) AS sim
    FROM word_submissions ws
    WHERE ws.status != 'rejected'
      AND similarity(ws.foreign_word, search_term) > threshold
    ORDER BY sim DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_spend ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- WORD_SUBMISSIONS
CREATE POLICY "Approved submissions are viewable by everyone"
  ON word_submissions FOR SELECT USING (status = 'approved' OR user_id = auth.uid());
CREATE POLICY "Authenticated users can insert submissions"
  ON word_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending submissions"
  ON word_submissions FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can update any submission"
  ON word_submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- AI_SUGGESTIONS
CREATE POLICY "AI suggestions are viewable by everyone"
  ON ai_suggestions FOR SELECT USING (true);

-- VOTES
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert votes"
  ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE USING (auth.uid() = user_id);

-- USER_SUGGESTIONS
CREATE POLICY "Approved user suggestions are viewable"
  ON user_suggestions FOR SELECT USING (status = 'approved' OR user_id = auth.uid());
CREATE POLICY "Authenticated users can insert user suggestions"
  ON user_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- MODERATION_FLAGS
CREATE POLICY "Users can insert flags"
  ON moderation_flags FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all flags"
  ON moderation_flags FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );
CREATE POLICY "Users can view own flags"
  ON moderation_flags FOR SELECT USING (auth.uid() = reporter_id);

-- RATE_LIMITS
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT USING (auth.uid() = user_id);

-- MONTHLY_SPEND
CREATE POLICY "Admins can view spend"
  ON monthly_spend FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
  );
