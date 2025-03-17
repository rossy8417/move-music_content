import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase, getPublicFileUrl, STORAGE_BUCKET, BASE_URL } from '../lib/supabase';
import type { Post, PostCategory } from '../types/database';

// カテゴリー別の背景色
const CATEGORY_COLORS = {
  character: 'e6f7ff',
  music: 'f0f7ff',
  talk: 'f5f0ff',
  video: 'fff0f6',
  default: 'f0f4f8'
};

// カテゴリー別のアイコン
const CATEGORY_ICONS = {
  character: '👤',
  music: '🎵',
  talk: '💬',
  video: '🎬',
  default: '📄'
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

  // ファイルのサムネイルURLを取得する関数
  const getThumbnailUrl = (post: any): string => {
    try {
      if (!post.file_url) return '';
      
      // 画像ファイルかどうかを確認
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(post.file_url);
      
      if (isImage) {
        // 新しいgetPublicFileUrl関数を使用
        try {
          const url = getPublicFileUrl(STORAGE_BUCKET, post.file_url);
          console.log(`生成されたURL: ${url}`);
          return url;
        } catch (error) {
          console.error('サムネイルURL生成エラー:', error);
          return '';
        }
      } else {
        // 画像以外のファイルの場合はカテゴリアイコンを表示
        return '';
      }
    } catch (error) {
      console.error('サムネイル処理エラー:', error);
      return '';
    }
  };

  // コンテンツタイプを判定する関数
  const getContentType = (post: Post) => {
    if (post.file_url) {
      const videoExts = ['.mp4', '.webm', '.ogg', '.mov'];
      const audioExts = ['.mp3', '.wav', '.ogg', '.m4a'];
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      
      if (videoExts.some(ext => post.file_url?.toLowerCase().endsWith(ext))) return 'video';
      if (audioExts.some(ext => post.file_url?.toLowerCase().endsWith(ext))) return 'audio';
      if (imageExts.some(ext => post.file_url?.toLowerCase().endsWith(ext))) return 'image';
    }
    
    if (post.external_url) {
      if (post.external_url.includes('youtube.com') || post.external_url.includes('youtu.be')) return 'youtube';
      if (post.external_url.includes('vimeo.com')) return 'vimeo';
      if (post.external_url.includes('nicovideo.jp')) return 'nicovideo';
      if (post.external_url.includes('soundcloud.com')) return 'soundcloud';
      if (post.external_url.includes('spotify.com')) return 'spotify';
    }
    
    return 'unknown';
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
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {posts.map((post) => {
            const contentType = getContentType(post);
            const color = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.default;
            const icon = CATEGORY_ICONS[post.category] || CATEGORY_ICONS.default;
            
            return (
              <Link 
                key={post.id} 
                to={`/post/${post.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  <div 
                    className={`absolute inset-0 flex items-center justify-center bg-[#${color}] text-[#2d3748] text-4xl`}
                    style={{ zIndex: 1 }}
                  >
                    {icon}
                  </div>
                  <img 
                    src={getThumbnailUrl(post)} 
                    alt={post.title}
                    className="relative z-10 w-full h-full object-cover"
                    onError={(e) => {
                      console.error('画像読み込みエラー:', e);
                      const target = e.target as HTMLImageElement;
                      
                      // ファイルURLが直接アクセス可能かチェック
                      if (post.file_url && post.file_url.startsWith('http')) {
                        console.log('直接URLを試行:', post.file_url);
                        target.src = post.file_url;
                        return;
                      }
                      
                      // それでもダメなら画像を非表示にして背景を表示
                      target.style.display = 'none';
                    }}
                  />
                  
                  {/* コンテンツタイプアイコン */}
                  <div className="absolute top-0 left-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 m-2 rounded z-20">
                    {contentType === 'video' && '🎬'}
                    {contentType === 'audio' && '🎵'}
                    {contentType === 'image' && '🖼️'}
                    {contentType === 'youtube' && '▶️'}
                    {contentType === 'vimeo' && '📹'}
                    {contentType === 'nicovideo' && '📺'}
                    {contentType === 'soundcloud' && '🔊'}
                    {contentType === 'spotify' && '🎧'}
                  </div>
                  
                  {post.external_url && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 m-2 rounded z-20">
                      外部
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 m-2 rounded capitalize z-20">
                    {post.category}
                  </div>
                </div>
                <div className="p-3">
                  <h2 className="text-sm font-semibold mb-1 line-clamp-1">{post.title}</h2>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}