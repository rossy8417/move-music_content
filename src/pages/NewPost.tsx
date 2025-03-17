import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, STORAGE_BUCKET, createStorageBucket, checkBucketPermissions } from '../lib/supabase';
import type { PostCategory } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

// 環境変数から投稿パスワードとSupabase URLを取得
const POST_PASSWORD = import.meta.env.VITE_POST_PASSWORD;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// デバッグ用のログ（本番環境では削除してください）
console.log('環境変数が正しく読み込まれているか確認:', {
  postPasswordExists: !!POST_PASSWORD,
  // 実際のパスワード値は表示しないでください
});

export function NewPost() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PostCategory>('character');
  const [fileUrl, setFileUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  
  // ファイルアップロード関連の状態
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 一時的なシステム通知
  const [systemNotice, setSystemNotice] = useState<string | null>(
    'ファイルアップロード機能を使用するには、管理者がストレージバケットを作成する必要があります。現在、ファイルアップロードは利用できない可能性があります。外部URLを使用してください。'
  );

  // バケットの状態を追跡
  const [bucketStatus, setBucketStatus] = useState<{
    checked: boolean;
    exists: boolean;
    canRead: boolean;
    canWrite: boolean;
    error: string | null;
  }>({
    checked: false,
    exists: false,
    canRead: false,
    canWrite: false,
    error: null
  });
  
  // コンポーネントマウント時にバケット権限を確認
  useEffect(() => {
    async function checkStorage() {
      try {
        console.log('ストレージバケットの権限を確認しています...');
        const permissions = await checkBucketPermissions();
        console.log('バケット権限確認結果:', permissions);
        
        setBucketStatus({
          checked: true,
          exists: permissions.exists,
          canRead: permissions.canRead,
          canWrite: permissions.canWrite,
          error: permissions.error || null
        });
        
        // バケットが存在しないか、権限がない場合はシステム通知を更新
        if (!permissions.exists || !permissions.canWrite) {
          let message = 'ファイルアップロード機能は現在利用できません。';
          
          if (!permissions.exists) {
            if (permissions.error && permissions.error.includes('大文字小文字')) {
              message += 'バケット名の大文字小文字が一致していません。管理者に連絡してください。';
            } else {
              message += 'ストレージバケットが存在しません。管理者に連絡してください。';
            }
          } else if (!permissions.canWrite) {
            message += 'アップロード権限がありません。管理者に連絡してください。';
          }
          
          message += ' 外部URLを使用してください。';
          setSystemNotice(message);
        }
      } catch (error) {
        console.error('バケット権限確認中にエラー:', error);
      }
    }
    
    checkStorage();
  }, []);

  // ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    // ファイルプレビューを生成
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // 既存のファイルURLをクリア
    setFileUrl('');

    return () => {
      // コンポーネントのクリーンアップ時にURLを解放
      URL.revokeObjectURL(objectUrl);
    };
  };

  // ファイルアップロード処理
  const uploadFile = async () => {
    if (!file) return null;

    // バケットの状態を確認
    if (bucketStatus.checked && (!bucketStatus.exists || !bucketStatus.canWrite)) {
      const errorMsg = !bucketStatus.exists 
        ? `ストレージバケット '${STORAGE_BUCKET}' が存在しないため、ファイルをアップロードできません。`
        : 'アップロード権限がないため、ファイルをアップロードできません。';
      
      setError(errorMsg + ' 外部URLを使用してください。');
      return null;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      console.log('ファイルアップロード開始:', { fileName: file.name, fileSize: file.size });

      // バケットが存在するか再確認
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('バケット一覧の取得に失敗しました:', listError);
        throw new Error('ストレージシステムへの接続に失敗しました: ' + listError.message);
      }
      
      console.log('利用可能なバケット一覧:', buckets?.map(b => b.name));
      
      // 大文字小文字を区別せずにバケットを検索
      const exactBucket = buckets?.find(bucket => bucket.name === STORAGE_BUCKET);
      const similarBucket = buckets?.find(bucket => bucket.name.toLowerCase() === STORAGE_BUCKET.toLowerCase());
      
      // 正確なバケット名が見つからない場合
      if (!exactBucket) {
        if (similarBucket) {
          // 大文字小文字のみ異なる場合
          console.warn(`バケット名の大文字小文字が一致しません。コード: '${STORAGE_BUCKET}', 実際: '${similarBucket.name}'`);
          throw new Error(`バケット名の大文字小文字が一致しません。管理者に連絡してください。`);
        } else {
          // バケットが存在しない場合
          console.error(`バケット '${STORAGE_BUCKET}' が見つかりません`);
          throw new Error(`ストレージバケット '${STORAGE_BUCKET}' が存在しません。管理者に連絡してください。`);
        }
      }

      // アップロード進捗を25%に設定
      setUploadProgress(25);

      // ファイル名を一意にするために現在時刻を追加
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      let filePath = fileName; // 最初はルートディレクトリに保存
      
      console.log('アップロード予定パス:', filePath);

      // アップロード進捗を50%に設定
      setUploadProgress(50);

      // Supabaseにファイルをアップロード
      console.log('ファイルアップロード実行:', { bucket: STORAGE_BUCKET, path: filePath });
      const { data, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // 同名ファイルが存在する場合は上書き
        });

      if (uploadError) {
        console.error('ファイルアップロードエラー（詳細）:', uploadError);
        
        // エラーメッセージをより具体的に
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error(`ストレージバケット '${STORAGE_BUCKET}' が見つかりません。管理者に連絡してください。`);
        } else if (uploadError.message.includes('row-level security policy')) {
          throw new Error('アップロード権限がありません。管理者に連絡してください。');
        } else {
          throw uploadError;
        }
      }

      // アップロード進捗を75%に設定
      setUploadProgress(75);
      console.log('ファイルアップロード成功:', data);

      // アップロードされたファイルの公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      console.log('取得した公開URL:', publicUrl);
      setUploadProgress(100);
      return publicUrl as string;
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('ファイルのアップロードに失敗しました');
      }
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // パスワードの検証
    if (password !== POST_PASSWORD) {
      setError('投稿パスワードが正しくありません');
      return;
    }

    // ファイルURLまたは外部URLのいずれかが必要
    if (!file && !fileUrl && !externalUrl) {
      setError('ファイルをアップロードするか、ファイルURLまたは外部URLのいずれかを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    // ファイルがある場合はアップロード
    let uploadedFileUrl = fileUrl;
    if (file) {
      try {
        const uploadedUrl = await uploadFile();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        uploadedFileUrl = uploadedUrl;
      } catch (error) {
        // エラーメッセージをより具体的に表示
        if (error instanceof Error) {
          setError(`ファイルアップロードエラー: ${error.message}`);
        } else {
          setError('ファイルのアップロードに失敗しました');
        }
        setLoading(false);
        return;
      }
    }

    // 固定の匿名ユーザーIDを使用
    const anonymousId = '00000000-0000-0000-0000-000000000000';
    console.log('使用するユーザーID:', anonymousId);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: anonymousId,
          title,
          description,
          category,
          file_url: uploadedFileUrl || null,
          external_url: externalUrl || null,
        });

      setLoading(false);

      if (error) {
        console.error('投稿エラー:', error);
        setError(error.message);
      } else {
        console.log('投稿成功:', data);
        navigate('/');
      }
    } catch (error) {
      setLoading(false);
      console.error('投稿処理中の例外:', error);
      if (error instanceof Error) {
        setError(`投稿エラー: ${error.message}`);
      } else {
        setError('投稿処理中に予期しないエラーが発生しました');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">新規投稿作成</h1>
        
        {/* システム通知 */}
        {systemNotice && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {systemNotice}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setSystemNotice(null)}
                    className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <span className="sr-only">閉じる</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              タイトル
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              カテゴリ
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="character">キャラクター</option>
              <option value="music">音楽</option>
              <option value="talk">会話</option>
              <option value="video">動画</option>
            </select>
          </div>

          {/* ファイルアップロード部分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ファイルアップロード
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ファイルを選択
              </label>
              <span className="ml-3 text-sm text-gray-500">
                {file ? file.name : 'ファイルが選択されていません'}
              </span>
            </div>

            {/* ファイルプレビュー */}
            {previewUrl && (
              <div className="mt-2">
                {category === 'character' ? (
                  <img
                    src={previewUrl}
                    alt="プレビュー"
                    className="h-40 object-contain"
                  />
                ) : category === 'video' ? (
                  <video
                    src={previewUrl}
                    controls
                    className="h-40 object-contain"
                  />
                ) : category === 'music' ? (
                  <audio
                    src={previewUrl}
                    controls
                    className="w-full"
                  />
                ) : (
                  <div className="text-sm text-gray-500">
                    プレビューを表示できません
                  </div>
                )}
              </div>
            )}

            {/* アップロード進捗バー */}
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700">
              ファイルURL（ファイルをアップロードする場合は不要）
            </label>
            <input
              id="fileUrl"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="externalUrl" className="block text-sm font-medium text-gray-700">
              外部URL（YouTube、SoundCloudなど）
            </label>
            <input
              id="externalUrl"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoComplete="off"
            />
            <p className="mt-1 text-sm text-gray-500">
              ファイルアップロードが利用できない場合は、外部URLを使用してください。YouTubeやSoundCloudなどの共有URLを入力できます。
            </p>
          </div>

          {/* 投稿パスワード入力欄 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              投稿パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoComplete="new-password"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              コミュニティで共有されている投稿パスワードを入力してください
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading || uploading ? '処理中...' : '投稿する'}
          </button>
        </form>
      </div>
    </div>
  );
}