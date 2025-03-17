-- 投票テーブルの作成
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- いいねテーブルの作成
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Row Level Security (RLS) の設定
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーの読み取り権限
CREATE POLICY "Allow anonymous read access" ON votes
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read access" ON likes
  FOR SELECT TO anon USING (true);

-- 匿名ユーザーの書き込み権限
CREATE POLICY "Allow anonymous insert access" ON votes
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous insert access" ON likes
  FOR INSERT TO anon WITH CHECK (true);

-- 自分の投票の削除権限
CREATE POLICY "Allow users to delete own votes" ON votes
  FOR DELETE TO anon USING (true);

-- 自分のいいねの削除権限
CREATE POLICY "Allow users to delete own likes" ON likes
  FOR DELETE TO anon USING (true); 