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
      // 1. サムネイル専用フィールドがあれば優先的に使用
      if (post.thumbnail_url) {
        return post.thumbnail_url;
      }
      
      // 2. 外部URLからサムネイルを取得（YouTube、Vimeoなど）
      if (post.external_url) {
        // YouTubeのサムネイル取得
        if (post.external_url.includes('youtube.com') || post.external_url.includes('youtu.be')) {
          const videoId = getYoutubeVideoId(post.external_url);
          if (videoId) {
            // 高品質サムネイル
            return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
        }
        
        // Vimeoのサムネイル取得（APIが必要なため簡易版）
        if (post.external_url.includes('vimeo.com')) {
          // Vimeoのサムネイルは直接取得できないため、プレースホルダーを返す
          return '';
        }
        
        // ニコニコ動画のサムネイル取得
        if (post.external_url.includes('nicovideo.jp')) {
          const match = post.external_url.match(/watch\/([^/?]+)/);
          if (match && match[1]) {
            return `https://nicovideo.cdn.nimg.jp/thumbnails/${match[1]}/${match[1]}.L`;
          }
        }
      }
      
      // 3. ファイルURLがなければ空を返す
      if (!post.file_url) return '';
      
      // 4. 画像ファイルかどうかを確認（音声や動画ファイルはサムネイルとして使用しない）
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      const isImageFile = imageExts.some(ext => post.file_url.toLowerCase().endsWith(ext));
      
      // 画像ファイルでない場合は空文字を返す
      if (!isImageFile) {
        return '';
      }
      
      // 5. 直接URLの場合はそのまま返す
      if (post.file_url.startsWith('http')) {
        console.log('直接URL使用:', post.file_url);
        return post.file_url;
      }
      
      // 6. Supabaseのストレージから取得
      // パスの先頭のスラッシュを削除（Supabaseの仕様）
      const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
      
      // 方法1: 改善されたgetPublicFileUrl関数を使用
      try {
        const url = getPublicFileUrl(STORAGE_BUCKET, post.file_url);
        console.log(`生成されたURL (方法1): ${url}`);
        if (url) return url;
      } catch (error) {
        console.error('サムネイルURL生成エラー (方法1):', error);
      }
      
      // 方法2: getPublicUrl APIを直接使用
      try {
        const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cleanPath).data.publicUrl;
        console.log(`生成されたURL (方法2): ${publicUrl}`);
        if (publicUrl) return publicUrl;
      } catch (error) {
        console.error('サムネイルURL生成エラー (方法2):', error);
      }
      
      // 方法3: 直接URLを構築
      try {
        const baseStorageUrl = import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.supabase.co/storage/v1/object/public');
        const directUrl = `${baseStorageUrl}/${STORAGE_BUCKET}/${cleanPath}`;
        console.log(`生成されたURL (方法3): ${directUrl}`);
        return directUrl;
      } catch (error) {
        console.error('サムネイルURL生成エラー (方法3):', error);
      }
      
      // すべての方法が失敗した場合は空文字を返す
      return '';
    } catch (error) {
      console.error('サムネイル処理エラー:', error);
      return '';
    }
  };

  // YouTubeのビデオIDを取得する関数
  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // YouTube URLからビデオIDを抽出する正規表現
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match && match[1] ? match[1] : null;
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
      {/* カテゴリーナビゲーション - モバイル表示のみ (md:768px未満) */}
      <div className="flex overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide md:hidden">
        <div className="flex space-x-2 min-w-full">
          <Link 
            to="/" 
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              !category ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            ALL
          </Link>
          <Link 
            to="/?category=character" 
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              category === 'character' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            キャラ
          </Link>
          <Link 
            to="/?category=music" 
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              category === 'music' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            音楽
          </Link>
          <Link 
            to="/?category=talk" 
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              category === 'talk' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            トーク
          </Link>
          <Link 
            to="/?category=video" 
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              category === 'video' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}
          >
            動画
          </Link>
        </div>
      </div>

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
                  {/* 画像や動画URLがある場合、または外部URLがある場合のみサムネイル表示を試みる */}
                  {/* Character, Videoカテゴリーは通常通り表示 */}
                  {/* Talk, Musicカテゴリーは外部URLがある場合のみサムネイル表示を試みる */}
                  {(post.category === 'character' || post.category === 'video') && post.file_url ? (
                    <img 
                      src={getThumbnailUrl(post)} 
                      alt={post.title}
                      className="relative z-10 w-full h-full object-cover"
                      onError={(e) => {
                        // エラーログを減らすため、詳細なログは出力しない
                        const target = e.target as HTMLImageElement;
                        
                        // 元のURLを記録
                        const originalSrc = target.src;
                        
                        // 方法1: 直接URLを試す
                        if (post.file_url && post.file_url.startsWith('http') && originalSrc !== post.file_url) {
                          target.src = post.file_url;
                          return;
                        }
                        
                        // 方法2: getPublicUrl APIを使用
                        try {
                          if (post.file_url) {
                            // パスの先頭のスラッシュを削除（Supabaseの仕様）
                            const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
                            const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cleanPath).data.publicUrl;
                            
                            if (originalSrc !== publicUrl) {
                              target.src = publicUrl;
                              return;
                            }
                          }
                        } catch (err) {
                          // エラー処理
                        }
                        
                        // 方法3: 直接URLを構築
                        try {
                          if (post.file_url) {
                            const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
                            const baseStorageUrl = import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.supabase.co/storage/v1/object/public');
                            const directUrl = `${baseStorageUrl}/${STORAGE_BUCKET}/${cleanPath}`;
                            
                            if (originalSrc !== directUrl) {
                              target.src = directUrl;
                              return;
                            }
                          }
                        } catch (err) {
                          // エラー処理
                        }
                        
                        // 方法4: 相対パスを試す
                        if (post.file_url && !post.file_url.startsWith('http') && originalSrc !== post.file_url) {
                          target.src = post.file_url;
                          return;
                        }
                        
                        // それでもダメなら画像を非表示にして背景を表示
                        target.style.display = 'none';
                      }}
                    />
                  ) : post.external_url ? (
                    // 外部URLがある場合（YouTubeなど）
                    <img 
                      src={getThumbnailUrl(post)} 
                      alt={post.title}
                      className="relative z-10 w-full h-full object-cover"
                      onError={(e) => {
                        // エラー時は画像を非表示にして背景を表示
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    // ファイルURLも外部URLもない場合、またはTalk/Musicカテゴリーで画像がない場合
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                      <div className="text-5xl">
                        {post.category === 'talk' && '💬'}
                        {post.category === 'music' && '🎵'}
                        {post.category === 'video' && '🎬'}
                        {post.category === 'character' && '👤'}
                        {contentType === 'youtube' && '▶️'}
                        {contentType === 'vimeo' && '📹'}
                        {contentType === 'nicovideo' && '📺'}
                        {contentType === 'soundcloud' && '🔊'}
                        {contentType === 'spotify' && '🎧'}
                        {contentType === 'unknown' && post.category !== 'talk' && post.category !== 'music' && post.category !== 'video' && post.category !== 'character' && '📄'}
                      </div>
                    </div>
                  )}
                  
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