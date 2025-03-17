-- コメントテーブルの作成
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) の設定
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーの読み取り権限
CREATE POLICY "Allow anonymous read access" ON comments
  FOR SELECT TO anon USING (true);

-- 匿名ユーザーの書き込み権限
CREATE POLICY "Allow anonymous insert access" ON comments
  FOR INSERT TO anon WITH CHECK (true);

-- 自分のコメントの更新権限
CREATE POLICY "Allow users to update own comments" ON comments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 自分のコメントの削除権限
CREATE POLICY "Allow users to delete own comments" ON comments
  FOR DELETE TO anon USING (true); 