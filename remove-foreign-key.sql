-- 外部キー制約を削除
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- user_idカラムをUUIDからTEXTに変更（オプション）
-- ALTER TABLE posts ALTER COLUMN user_id TYPE TEXT; 