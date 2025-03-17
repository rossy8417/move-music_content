import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, getPublicFileUrl, STORAGE_BUCKET } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Comment, Profile } from '../types/database';
import { MessageSquare, ThumbsUp, ArrowLeft, ExternalLink, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [comments, setComments] = useState<(Comment & { author: Profile })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // 匿名ユーザーID（認証なしでも機能を使えるようにする）
  const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

  // 現在のユーザーID（認証済みまたは匿名）
  const currentUserId = user?.id || ANONYMOUS_USER_ID;

  useEffect(() => {
    if (!id) return;

    async function fetchPostData() {
      setLoading(true);
      
      try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        setLoading(false);
        return;
      }

      setPost(postData);

        // Fetch author (with error handling)
        try {
          const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', postData.user_id)
        .single();

          if (authorError) {
            console.error('プロフィール取得エラー:', authorError);
            // エラーがあってもクラッシュしないよう続行
          } else {
      setAuthor(authorData);
          }
        } catch (err) {
          console.error('プロフィール取得中に例外が発生:', err);
          // エラーを記録するだけで処理を続行
        }

        // Fetch comments with authors (with table existence check)
        try {
          // まずテーブルが存在するか確認
          const { error: tableCheckError } = await supabase
            .from('comments')
            .select('count', { count: 'exact', head: true })
            .limit(1);

          if (!tableCheckError) {
            // テーブルが存在する場合のみコメントを取得
            const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
              .select('*, user_id')
        .eq('post_id', id)
        .order('created_at', { ascending: false });

            if (!commentsError && commentsData) {
              // プロフィール情報を別途取得して結合
              const commentsWithAuthors = await Promise.all(
                commentsData.map(async (comment) => {
                  try {
                    const { data: profileData } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', comment.user_id)
                      .single();
                    
                    return {
                      ...comment,
                      author: profileData || { username: '匿名ユーザー' }
                    };
                  } catch (err) {
                    return {
                      ...comment,
                      author: { username: '匿名ユーザー' }
                    };
                  }
                })
              );
              
              setComments(commentsWithAuthors);
            } else {
              console.log('コメントの取得に失敗またはコメントがありません:', commentsError);
              setComments([]);
            }
          } else {
            console.log('commentsテーブルが存在しない可能性があります:', tableCheckError);
            setComments([]);
          }
        } catch (err) {
          console.error('コメント取得中に例外が発生:', err);
          setComments([]);
        }

        // Fetch likes count (with error handling)
        try {
          const { count: likesCountData, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id);

          if (!likesError) {
      setLikesCount(likesCountData || 0);
          } else {
            console.log('いいね数の取得に失敗:', likesError);
          }
        } catch (err) {
          console.error('いいね数取得中に例外が発生:', err);
        }

        // Check if current user has liked
        try {
          const { data: likeData, error: likeError } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', id)
            .eq('user_id', currentUserId);

          if (!likeError && likeData && likeData.length > 0) {
            setHasLiked(true);
          } else {
            setHasLiked(false);
            if (likeError && likeError.code !== 'PGRST116') {
              console.error('いいね状態の確認中にエラー:', likeError);
            }
          }
        } catch (err) {
          console.error('いいね状態の確認中に例外が発生:', err);
          setHasLiked(false);
        }
      } catch (err) {
        console.error('データ取得中に予期しない例外が発生:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPostData();
  }, [id, currentUserId]);

  // コンテンツタイプを判定する関数
  const getContentType = () => {
    if (!post) return 'unknown';
    
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

  // YouTubeのビデオIDを取得
  const getYoutubeVideoId = () => {
    if (!post?.external_url) return null;
    
    const match = post.external_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match && match[1] ? match[1] : null;
  };

  // ファイルのURLを取得
  const getFileUrl = () => {
    if (!post?.file_url) return '';
    
    // 直接URLの場合はそのまま返す
    if (post.file_url.startsWith('http')) {
      console.log('直接URL使用:', post.file_url);
      return post.file_url;
    }
    
    try {
      // 改善された関数を使用
      const url = getPublicFileUrl(STORAGE_BUCKET, post.file_url);
      console.log('公開URL生成成功:', url);
      return url;
    } catch (error) {
      console.error('ファイルURL生成エラー:', error);
      
      // エラー時は別の方法を試す
      try {
        // パスの先頭のスラッシュを削除（Supabaseの仕様）
        const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
        
        // 方法1: getPublicUrl APIを使用
        try {
          const publicUrl = `${supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cleanPath).data.publicUrl}`;
          console.log('代替URL生成1:', publicUrl);
          return publicUrl;
        } catch (err) {
          console.error('代替URL生成1エラー:', err);
        }
        
        // 方法2: 直接URLを構築
        try {
          const baseStorageUrl = import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.supabase.co/storage/v1/object/public');
          const directUrl = `${baseStorageUrl}/${STORAGE_BUCKET}/${cleanPath}`;
          console.log('代替URL生成2:', directUrl);
          return directUrl;
        } catch (err) {
          console.error('代替URL生成2エラー:', err);
        }
        
        // 方法3: 相対パスを試す
        return post.file_url;
      } catch (err) {
        console.error('代替URL生成エラー:', err);
        return '';
      }
    }
  };

  // 再生/一時停止の切り替え
  const togglePlay = () => {
    const contentType = getContentType();
    
    if (contentType === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (contentType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // ミュート切り替え
  const toggleMute = () => {
    const contentType = getContentType();
    
    if (contentType === 'audio' && audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    } else if (contentType === 'video' && videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // コメント送信処理
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setActionError(null);

    try {
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: id,
          user_id: currentUserId,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment('');
        // Refresh comments with error handling
        try {
          const { data, error: refreshError } = await supabase
        .from('comments')
            .select('*, user_id')
        .eq('post_id', id)
        .order('created_at', { ascending: false });

          if (!refreshError && data) {
            // プロフィール情報を別途取得して結合
            const commentsWithAuthors = await Promise.all(
              data.map(async (comment) => {
                try {
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', comment.user_id)
                    .single();
                  
                  return {
                    ...comment,
                    author: profileData || { username: '匿名ユーザー' }
                  };
                } catch (err) {
                  return {
                    ...comment,
                    author: { username: '匿名ユーザー' }
                  };
                }
              })
            );
            
            setComments(commentsWithAuthors);
          }
        } catch (err) {
          console.error('コメント更新中に例外が発生:', err);
        }
      } else {
        console.error('コメント投稿エラー:', error);
        setActionError('コメントの投稿に失敗しました。テーブルが存在するか確認してください。');
      }
    } catch (err) {
      console.error('コメント送信中に例外が発生:', err);
      setActionError('コメントの送信中にエラーが発生しました。');
    }
  };

  // いいね処理
  const handleLike = async () => {
    if (!id) return;

    setActionError(null);

    try {
    if (hasLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', id)
          .eq('user_id', currentUserId);

      if (!error) {
        setHasLiked(false);
        setLikesCount(prev => prev - 1);
        } else {
          console.error('いいね削除エラー:', error);
          setActionError('いいねの取り消しに失敗しました。');
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: id,
            user_id: currentUserId,
        });

      if (!error) {
        setHasLiked(true);
        setLikesCount(prev => prev + 1);
        } else {
          console.error('いいねエラー:', error);
          setActionError('いいねに失敗しました。テーブルが存在するか確認してください。');
        }
      }
    } catch (err) {
      console.error('いいね処理中に例外が発生:', err);
      setActionError('いいね処理中にエラーが発生しました。');
    }
  };

  // コンテンツ表示部分
  const renderContent = () => {
    const contentType = getContentType();
    
    switch (contentType) {
      case 'image':
        return (
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500">
                <span className="text-4xl">🖼️</span>
              </div>
              <img 
                src={getFileUrl()} 
                alt={post?.title} 
                className="relative z-10 w-full h-auto max-h-[600px] object-contain mx-auto"
                onError={(e) => {
                  console.error('画像読み込みエラー:', e);
                  const target = e.target as HTMLImageElement;
                  
                  // 別の方法でURLを生成してみる
                  try {
                    if (post?.file_url) {
                      // 方法1: getPublicUrl APIを使用
                      try {
                        // パスの先頭のスラッシュを削除（Supabaseの仕様）
                        const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
                        const publicUrl = `${supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cleanPath).data.publicUrl}`;
                        console.log('代替URL生成1:', publicUrl);
                        
                        // 現在のURLと異なる場合のみ設定
                        if (target.src !== publicUrl) {
                          target.src = publicUrl;
                          return;
                        }
                      } catch (err) {
                        console.error('代替URL生成1エラー:', err);
                      }
                      
                      // 方法2: 直接URLを構築
                      try {
                        const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
                        const baseStorageUrl = import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.supabase.co/storage/v1/object/public');
                        const directUrl = `${baseStorageUrl}/${STORAGE_BUCKET}/${cleanPath}`;
                        console.log('代替URL生成2:', directUrl);
                        
                        if (target.src !== directUrl) {
                          target.src = directUrl;
                          return;
                        }
                      } catch (err) {
                        console.error('代替URL生成2エラー:', err);
                      }
                    }
                  } catch (err) {
                    console.error('代替URL生成エラー:', err);
                  }
                  
                  // 直接URLを試す最後の手段
                  if (post?.file_url && !post.file_url.startsWith('http') && target.src !== post.file_url) {
                    console.log('直接パスを試行:', post.file_url);
                    target.src = post.file_url;
                    return;
                  }
                  
                  // それでもダメなら画像を非表示にして背景を表示
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        );
        
      case 'video':
        return (
          <div className="bg-black rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-300">
              <span className="text-4xl">🎬</span>
            </div>
            <video 
              ref={videoRef}
              src={getFileUrl()} 
              className="relative z-10 w-full h-auto max-h-[600px]"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('動画読み込みエラー:', e);
                const target = e.target as HTMLVideoElement;
                
                // 別の方法でURLを生成してみる
                try {
                  if (post?.file_url) {
                    // 方法1: getPublicUrl APIを使用
                    try {
                      // パスの先頭のスラッシュを削除（Supabaseの仕様）
                      const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
                      const publicUrl = `${supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cleanPath).data.publicUrl}`;
                      console.log('代替URL生成1:', publicUrl);
                      
                      // 現在のURLと異なる場合のみ設定
                      if (target.src !== publicUrl) {
                        target.src = publicUrl;
                        return;
                      }
                    } catch (err) {
                      console.error('代替URL生成1エラー:', err);
                    }
                    
                    // 方法2: 直接URLを構築
                    try {
                      const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
                      const baseStorageUrl = import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.supabase.co/storage/v1/object/public');
                      const directUrl = `${baseStorageUrl}/${STORAGE_BUCKET}/${cleanPath}`;
                      console.log('代替URL生成2:', directUrl);
                      
                      if (target.src !== directUrl) {
                        target.src = directUrl;
                        return;
                      }
                    } catch (err) {
                      console.error('代替URL生成2エラー:', err);
                    }
                  }
                } catch (err) {
                  console.error('代替URL生成エラー:', err);
                }
                
                // 直接URLを試す最後の手段
                if (post?.file_url && !post.file_url.startsWith('http') && target.src !== post.file_url) {
                  console.log('直接パスを試行:', post.file_url);
                  target.src = post.file_url;
                  return;
                }
                
                target.style.display = 'none';
              }}
            />
            <div className="absolute bottom-4 left-4 flex space-x-2 z-20">
              <button 
                onClick={togglePlay}
                className="bg-black bg-opacity-70 text-white p-2 rounded-full"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button 
                onClick={toggleMute}
                className="bg-black bg-opacity-70 text-white p-2 rounded-full"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>
        );
        
      case 'audio':
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={togglePlay}
                className="bg-blue-500 text-white p-3 rounded-full"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <div className="flex-1">
                <h3 className="font-medium">{post?.title}</h3>
                <p className="text-sm text-gray-500">{post?.description}</p>
              </div>
              <button 
                onClick={toggleMute}
                className="text-gray-700 p-2 rounded-full"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
            <audio 
              ref={audioRef}
              src={getFileUrl()} 
              className="w-full mt-4" 
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('音声読み込みエラー:', e);
                const target = e.target as HTMLAudioElement;
                
                // 別の方法でURLを生成してみる
                try {
                  if (post?.file_url) {
                    // 方法1: getPublicUrl APIを使用
                    try {
                      // パスの先頭のスラッシュを削除（Supabaseの仕様）
                      const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
                      const publicUrl = `${supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cleanPath).data.publicUrl}`;
                      console.log('代替URL生成1:', publicUrl);
                      
                      // 現在のURLと異なる場合のみ設定
                      if (target.src !== publicUrl) {
                        target.src = publicUrl;
                        // 再生を試みる
                        target.load();
                        return;
                      }
                    } catch (err) {
                      console.error('代替URL生成1エラー:', err);
                    }
                    
                    // 方法2: 直接URLを構築
                    try {
                      const cleanPath = post.file_url.startsWith('/') ? post.file_url.substring(1) : post.file_url;
                      const baseStorageUrl = import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.supabase.co/storage/v1/object/public');
                      const directUrl = `${baseStorageUrl}/${STORAGE_BUCKET}/${cleanPath}`;
                      console.log('代替URL生成2:', directUrl);
                      
                      if (target.src !== directUrl) {
                        target.src = directUrl;
                        target.load();
                        return;
                      }
                    } catch (err) {
                      console.error('代替URL生成2エラー:', err);
                    }
                  }
                } catch (err) {
                  console.error('代替URL生成エラー:', err);
                }
                
                // 直接URLを試す最後の手段
                if (post?.file_url && !post.file_url.startsWith('http') && target.src !== post.file_url) {
                  console.log('直接パスを試行:', post.file_url);
                  target.src = post.file_url;
                  target.load();
                  return;
                }
                
                // それでもダメならエラーメッセージを表示
                const audioContainer = target.parentElement;
                if (audioContainer) {
                  audioContainer.innerHTML = '<p class="text-center text-red-500 my-2">音声ファイルを読み込めませんでした</p>';
                }
              }}
            />
          </div>
        );
        
      case 'youtube':
        const videoId = getYoutubeVideoId();
        return videoId ? (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={post?.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p>YouTubeビデオを読み込めませんでした</p>
            {post?.external_url && (
              <a 
                href={post.external_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 flex items-center justify-center mt-2"
              >
                <ExternalLink size={16} className="mr-1" /> 直接リンクを開く
              </a>
            )}
          </div>
        );
        
      default:
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            {post?.external_url ? (
              <div className="text-center">
                <p className="mb-2">外部コンテンツへのリンク</p>
                <a 
                  href={post.external_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 flex items-center justify-center"
                >
                  <ExternalLink size={16} className="mr-1" /> 外部リンクを開く
                </a>
              </div>
            ) : (
              <p className="text-center">{post?.description || 'コンテンツがありません'}</p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Post not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} className="mr-1" /> 戻る
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <span className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>

          {renderContent()}

          <div className="mt-6">
          {post.description && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium mb-2">説明</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>
              </div>
              )}
            </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4">
              {actionError}
            </div>
          )}

          <div className="flex items-center space-x-6 border-t border-gray-200 pt-6 mt-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                hasLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <ThumbsUp size={20} />
              <span>{likesCount}</span>
            </button>
            <div className="flex items-center space-x-1 text-gray-600">
              <MessageSquare size={20} />
              <span>{comments.length}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">コメント</h2>

          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              コメントする
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">コメントはまだありません</p>
        ) : (
            <div className="space-y-4">
          {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {comment.author?.avatar_url ? (
                  <img
                    src={comment.author.avatar_url}
                    alt={comment.author.username}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-2" />
                      )}
                      <span className="font-medium">{comment.author?.username || '匿名ユーザー'}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}