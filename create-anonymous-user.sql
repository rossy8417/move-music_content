-- 匿名ユーザーが存在しない場合は作成
INSERT INTO auth.users (id, email, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'anonymous@example.com', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 匿名ユーザーのプロフィールを作成
INSERT INTO public.profiles (id, username, avatar_url)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Anonymous User', NULL)
ON CONFLICT (id) DO NOTHING; 