-- ============================================
-- K-TV STREAMING PLATFORM - COMPLETE SQL SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. SERIES TABLE
CREATE TABLE IF NOT EXISTS series (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail TEXT,
  description TEXT,
  genre TEXT DEFAULT 'K-Drama',
  rating TEXT DEFAULT 'PG-13',
  quality TEXT DEFAULT 'HD',
  language TEXT DEFAULT 'Korean',
  release_year INT,
  total_episodes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EPISODES TABLE
CREATE TABLE IF NOT EXISTS episodes (
  id BIGSERIAL PRIMARY KEY,
  series_id BIGINT REFERENCES series(id) ON DELETE CASCADE,
  episode_number INT NOT NULL,
  title TEXT,
  video_url TEXT NOT NULL,
  duration TEXT DEFAULT '45 min',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VIEWS TABLE
CREATE TABLE IF NOT EXISTS views (
  id BIGSERIAL PRIMARY KEY,
  series_id BIGINT REFERENCES series(id) ON DELETE CASCADE,
  episode_id BIGINT REFERENCES episodes(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LIKES TABLE
CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  series_id BIGINT REFERENCES series(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(series_id, session_id)
);

-- 5. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  series_id BIGINT REFERENCES series(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_episodes_series_id ON episodes(series_id);
CREATE INDEX IF NOT EXISTS idx_views_series_id ON views(series_id);
CREATE INDEX IF NOT EXISTS idx_views_episode_id ON views(episode_id);
CREATE INDEX IF NOT EXISTS idx_likes_series_id ON likes(series_id);
CREATE INDEX IF NOT EXISTS idx_comments_series_id ON comments(series_id);

-- ============================================
-- VIEWS (AGGREGATED) FOR EASY QUERYING
-- ============================================

-- View: Series with counts
CREATE OR REPLACE VIEW series_stats AS
SELECT 
  s.id,
  s.title,
  s.thumbnail,
  s.description,
  s.genre,
  s.rating,
  s.quality,
  s.language,
  s.release_year,
  s.created_at,
  COUNT(DISTINCT e.id) AS episode_count,
  COUNT(DISTINCT v.id) AS view_count,
  COUNT(DISTINCT l.id) AS like_count,
  COUNT(DISTINCT c.id) AS comment_count
FROM series s
LEFT JOIN episodes e ON e.series_id = s.id
LEFT JOIN views v ON v.series_id = s.id
LEFT JOIN likes l ON l.series_id = s.id
LEFT JOIN comments c ON c.series_id = s.id
GROUP BY s.id;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - PUBLIC READ
-- ============================================

ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read series" ON series FOR SELECT USING (true);
CREATE POLICY "Public read episodes" ON episodes FOR SELECT USING (true);
CREATE POLICY "Public read views" ON views FOR SELECT USING (true);
CREATE POLICY "Public read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);

-- Public insert for views, likes, comments
CREATE POLICY "Public insert views" ON views FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert likes" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete likes" ON likes FOR DELETE USING (true);
CREATE POLICY "Public insert comments" ON comments FOR INSERT WITH CHECK (true);

-- Admin policies for series & episodes (all operations)
CREATE POLICY "Admin manage series" ON series FOR ALL USING (true);
CREATE POLICY "Admin manage episodes" ON episodes FOR ALL USING (true);
CREATE POLICY "Admin delete comments" ON comments FOR DELETE USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: increment view count
CREATE OR REPLACE FUNCTION increment_view(p_series_id BIGINT, p_episode_id BIGINT, p_session TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO views (series_id, episode_id, session_id)
  VALUES (p_series_id, p_episode_id, p_session)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function: toggle like
CREATE OR REPLACE FUNCTION toggle_like(p_series_id BIGINT, p_session TEXT)
RETURNS TEXT AS $$
DECLARE
  existing_id BIGINT;
BEGIN
  SELECT id INTO existing_id FROM likes 
  WHERE series_id = p_series_id AND session_id = p_session;
  
  IF existing_id IS NOT NULL THEN
    DELETE FROM likes WHERE id = existing_id;
    RETURN 'unliked';
  ELSE
    INSERT INTO likes (series_id, session_id) VALUES (p_series_id, p_session);
    RETURN 'liked';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- INSERT INTO series (title, thumbnail, description, genre, rating, quality, language, release_year)
-- VALUES 
-- ('Crash Landing on You', 'https://via.placeholder.com/300x450', 'A South Korean heiress crash-lands in North Korea.', 'K-Drama', 'PG-13', '4K', 'Korean', 2019),
-- ('The Untamed', 'https://via.placeholder.com/300x450', 'Two men uncover a dark mystery from the past.', 'C-Drama', 'PG', 'HD', 'Chinese', 2019);