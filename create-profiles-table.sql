-- プロフィールテーブルの作成
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) の設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーの読み取り権限
CREATE POLICY "Allow anonymous read access" ON profiles
  FOR SELECT TO anon USING (true);

-- 匿名ユーザーの書き込み権限
CREATE POLICY "Allow anonymous insert access" ON profiles
  FOR INSERT TO anon WITH CHECK (true);

-- 自分のプロフィールの更新権限
CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 匿名ユーザーの作成
INSERT INTO auth.users (id, email, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'anonymous@example.com', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 匿名ユーザーのプロフィールを作成
INSERT INTO profiles (id, username, avatar_url)
VALUES 
  ('00000000-0000-0000-0000-000000000000', '匿名ユーザー', NULL)
ON CONFLICT (id) DO NOTHING; 