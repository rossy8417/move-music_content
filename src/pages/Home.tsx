import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Post, PostCategory } from '../types/database';

// カテゴリー別のデフォルト画像
const DEFAULT_IMAGES = {
  character: '/assets/default-character.svg',
  music: '/assets/default-music.svg',
  talk: '/assets/default-talk.svg',
  video: '/assets/default-video.svg',
  default: '/assets/default-post.svg'
};

export function Home() {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const category = searchParams.get('category') as PostCategory | null;

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      let query = supabase.from('posts').select('*');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
      
      setLoading(false);
    }

    fetchPosts();
  }, [category]);

  // サムネイル画像のURLを取得する関数
  const getThumbnailUrl = (post: Post) => {
    // 1. アップロードされたファイルがある場合
    if (post.file_url) {
      console.log('ファイルURL:', post.file_url);
      // 画像ファイルの拡張子かどうかをチェック
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      const isImage = imageExtensions.some(ext => 
        post.file_url?.toLowerCase().endsWith(ext)
      );
      
      if (isImage) {
        // Supabaseのストレージから画像URLを生成
        return supabase.storage.from('contest-files').getPublicUrl(post.file_url).data.publicUrl;
      }
    }
    
    // 2. 外部URLがある場合（YouTubeやVimeoなど）
    if (post.external_url) {
      console.log('外部URL:', post.external_url);
      // YouTube URLからサムネイルを取得
      const youtubeMatch = post.external_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (youtubeMatch && youtubeMatch[1]) {
        const videoId = youtubeMatch[1];
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
      
      // Vimeo URLからサムネイルを取得（注：実際にはVimeo APIが必要）
      const vimeoMatch = post.external_url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        // 本来はVimeo APIを使用すべきですが、ここではプレースホルダーとして
        return DEFAULT_IMAGES.video;
      }
      
      // ニコニコ動画URLからサムネイルを取得
      const nicovideoMatch = post.external_url.match(/nicovideo\.jp\/watch\/(sm\d+)/);
      if (nicovideoMatch && nicovideoMatch[1]) {
        // ニコニコ動画のサムネイルURLフォーマット
        return DEFAULT_IMAGES.video;
      }
    }
    
    // 3. カテゴリー別のデフォルト画像を返す
    return DEFAULT_IMAGES[post.category] || DEFAULT_IMAGES.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Posts` : 'All Posts'}
      </h1>
      
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No posts found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              to={`/posts/${post.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-video relative overflow-hidden bg-gray-100">
                <img 
                  src={getThumbnailUrl(post)} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 画像読み込みエラー時にデフォルト画像に置き換え
                    console.error('画像読み込みエラー:', e);
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_IMAGES[post.category] || DEFAULT_IMAGES.default;
                  }}
                />
                {post.external_url && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 m-2 rounded">
                    外部リンク
                  </div>
                )}
                <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 m-2 rounded capitalize">
                  {post.category}
                </div>
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h2>
                {post.description && (
                  <p className="text-gray-600 mb-3 line-clamp-2 text-sm">{post.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}