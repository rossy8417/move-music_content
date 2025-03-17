import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからハッシュフラグメントを取得
        const hashFragment = window.location.hash;
        console.log('認証コールバック: ハッシュフラグメント', hashFragment);

        // セッション情報を取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('セッション取得エラー:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (!session) {
          console.warn('セッションが見つかりません');
          setError('認証に失敗しました。もう一度お試しください。');
          return;
        }

        console.log('認証成功:', session);
        
        // ユーザー情報をローカルストレージに保存
        localStorage.setItem('user', JSON.stringify(session.user));
        
        // ホームページにリダイレクト
        navigate('/', { replace: true });
      } catch (err) {
        console.error('認証コールバックエラー:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md w-full">
          <h1 className="text-xl font-bold text-red-700 mb-2">認証エラー</h1>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-blue-700 mb-2">認証中...</h1>
        <p className="text-blue-600">ログイン情報を処理しています。しばらくお待ちください。</p>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </div>
    </div>
  );
} 