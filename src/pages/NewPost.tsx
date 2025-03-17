import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import type { PostCategory } from '../types/database';

// 環境変数から投稿パスワードを取得
const POST_PASSWORD = import.meta.env.VITE_POST_PASSWORD;

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

    try {
      setUploading(true);
      setUploadProgress(0);

      // ファイル名を一意にするために現在時刻を追加
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Supabaseにファイルをアップロード
      const { data, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET) // 共通のバケット名を使用
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // アップロードされたファイルの公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET) // 共通のバケット名を使用
        .getPublicUrl(filePath);

      setUploadProgress(100);
      return publicUrl as string;
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
      setError('ファイルのアップロードに失敗しました');
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
      const uploadedUrl = await uploadFile();
      if (!uploadedUrl) {
        setLoading(false);
        return;
      }
      uploadedFileUrl = uploadedUrl;
    }

    // ユーザーIDの代わりに匿名IDを使用
    const anonymousId = 'anonymous-' + Date.now();

    const { error } = await supabase
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
      navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">新規投稿作成</h1>

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