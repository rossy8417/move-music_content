import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ストレージバケットの名前
export const STORAGE_BUCKET = 'contest-files';

// ストレージバケットを初期化する関数
export async function initializeStorage() {
  try {
    // バケットが存在するか確認
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

    // バケットが存在しない場合は作成
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true, // ファイルを公開アクセス可能に設定
      });

      if (error) {
        console.error('ストレージバケットの作成に失敗しました:', error);
      } else {
        console.log(`ストレージバケット '${STORAGE_BUCKET}' を作成しました`);
      }
    } else {
      console.log(`ストレージバケット '${STORAGE_BUCKET}' は既に存在します`);
    }
  } catch (error) {
    console.error('ストレージの初期化中にエラーが発生しました:', error);
  }
}