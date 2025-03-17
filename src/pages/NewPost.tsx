import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
  // 投稿パスワード用の状態を追加
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // パスワードの検証
    if (password !== POST_PASSWORD) {
      setError('投稿パスワードが正しくありません');
      return;
    }

    if (!fileUrl && !externalUrl) {
      setError('ファイルURLまたは外部URLのいずれかを入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    // ユーザーIDの代わりに匿名IDを使用
    const anonymousId = 'anonymous-' + Date.now();

    const { error } = await supabase
      .from('posts')
      .insert({
        // user_id: user.id, // ユーザーIDの代わりに匿名IDを使用
        user_id: anonymousId,
        title,
        description,
        category,
        file_url: fileUrl || null,
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

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700">
              ファイルURL
            </label>
            <input
              id="fileUrl"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            />
          </div>

          {/* 投稿パスワード入力欄を追加 */}
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
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? '投稿中...' : '投稿する'}
          </button>
        </form>
      </div>
    </div>
  );
}