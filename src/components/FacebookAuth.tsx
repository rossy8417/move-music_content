import React, { useState } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { useFacebookAuth } from '../contexts/FacebookAuthContext';

interface FacebookAuthProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function FacebookAuth({ onSuccess, onError }: FacebookAuthProps) {
  const { signIn } = useFacebookAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Facebookログインを開始します...');
      await signIn();
      
      console.log('Facebookログイン処理完了');
      onSuccess?.();
    } catch (err) {
      console.error('予期せぬエラー:', err);
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleFacebookLogin}
        disabled={loading}
        className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-2 px-4 rounded-md hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs"
      >
        <FaFacebook size={20} />
        <span>{loading ? 'ログイン中...' : 'Facebookでログイン'}</span>
      </button>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 