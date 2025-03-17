-- postsテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT,
  external_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーに読み取り権限を付与
CREATE POLICY "Allow anonymous read access" ON posts
  FOR SELECT TO anon USING (true);

-- 匿名ユーザーに書き込み権限を付与
CREATE POLICY "Allow anonymous insert access" ON posts
  FOR INSERT TO anon WITH CHECK (true);

-- 匿名ユーザーに更新権限を付与（オプション）
CREATE POLICY "Allow anonymous update access" ON posts
  FOR UPDATE TO anon USING (true);

-- 匿名ユーザーに削除権限を付与（オプション）
CREATE POLICY "Allow anonymous delete access" ON posts
  FOR DELETE TO anon USING (true); 