-- Add target_language column to word_submissions
-- Existing rows default to 'ka' (Georgian) for backward compatibility
ALTER TABLE word_submissions
  ADD COLUMN target_language TEXT NOT NULL DEFAULT 'ka';

CREATE INDEX idx_word_submissions_target_language
  ON word_submissions(target_language);

-- Update find_similar_words to filter by target_language
DROP FUNCTION IF EXISTS find_similar_words(TEXT, FLOAT);

CREATE OR REPLACE FUNCTION find_similar_words(search_term TEXT, threshold REAL DEFAULT 0.3, target_lang TEXT DEFAULT 'ka')
RETURNS TABLE(id UUID, foreign_word TEXT, similarity REAL) AS $$
BEGIN
  RETURN QUERY
    SELECT ws.id, ws.foreign_word, similarity(ws.foreign_word, search_term) AS sim
    FROM public.word_submissions ws
    WHERE ws.status != 'rejected'
      AND ws.target_language = target_lang
      AND similarity(ws.foreign_word, search_term) > threshold
    ORDER BY sim DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
