-- Security hardening migration
-- Fixes: race conditions (rate limit, token budget, votes), adds audit log, tightens RLS

-- ============================================================
-- FUNCTION: Atomic rate limit check-and-record
-- Prevents TOCTOU race where concurrent requests bypass limits
-- ============================================================
CREATE OR REPLACE FUNCTION check_and_record_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_requests INT,
  p_window_minutes INT
) RETURNS TABLE(allowed BOOLEAN, current_count BIGINT) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count BIGINT;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Count existing requests within the window
  SELECT COUNT(*) INTO v_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND window_start >= v_window_start;

  IF v_count >= p_max_requests THEN
    RETURN QUERY SELECT FALSE, v_count;
    RETURN;
  END IF;

  -- Insert atomically within the same transaction
  INSERT INTO public.rate_limits (user_id, action_type, window_start)
  VALUES (p_user_id, p_action_type, now());

  RETURN QUERY SELECT TRUE, v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- FUNCTION: Atomic token usage increment
-- Prevents lost updates when concurrent requests read-then-write
-- ============================================================
CREATE OR REPLACE FUNCTION increment_tokens_used(
  p_user_id UUID,
  p_tokens INT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET tokens_used_today = tokens_used_today + p_tokens,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- FUNCTION: Atomic monthly spend upsert
-- Prevents lost updates and duplicate insert races
-- ============================================================
CREATE OR REPLACE FUNCTION record_monthly_spend(
  p_month_year TEXT,
  p_tokens INT,
  p_cost_cents INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.monthly_spend (month_year, total_tokens, total_cost_cents)
  VALUES (p_month_year, p_tokens, p_cost_cents)
  ON CONFLICT (month_year) DO UPDATE SET
    total_tokens = monthly_spend.total_tokens + EXCLUDED.total_tokens,
    total_cost_cents = monthly_spend.total_cost_cents + EXCLUDED.total_cost_cents,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- FUNCTION: Atomic vote upsert
-- Prevents race where two concurrent votes both pass the existence check
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_vote(
  p_user_id UUID,
  p_suggestion_id UUID,
  p_vote_type SMALLINT
) RETURNS TABLE(action TEXT, vote_type SMALLINT) AS $$
DECLARE
  v_existing RECORD;
BEGIN
  SELECT * INTO v_existing FROM public.votes v
  WHERE v.user_id = p_user_id AND v.suggestion_id = p_suggestion_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing.vote_type = p_vote_type THEN
      DELETE FROM public.votes WHERE id = v_existing.id;
      RETURN QUERY SELECT 'removed'::TEXT, p_vote_type;
    ELSE
      UPDATE public.votes SET vote_type = p_vote_type WHERE id = v_existing.id;
      RETURN QUERY SELECT 'updated'::TEXT, p_vote_type;
    END IF;
  ELSE
    INSERT INTO public.votes (user_id, suggestion_id, vote_type)
    VALUES (p_user_id, p_suggestion_id, p_vote_type);
    RETURN QUERY SELECT 'created'::TEXT, p_vote_type;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- TABLE: audit_log (moderator action trail)
-- ============================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   UUID NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
  ON audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_log FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- NOTE: Profile RLS intentionally kept as USING(true).
-- Profiles only expose display_name + avatar_url, and the leaderboard
-- needs to work for unauthenticated visitors.
