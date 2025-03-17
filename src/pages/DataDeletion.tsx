import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFacebookAuth } from '../contexts/FacebookAuthContext';

export function DataDeletion() {
  const { user: facebookUser, isAuthenticated } = useFacebookAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() && !isAuthenticated) {
      setError('メールアドレスを入力するか、Facebookでログインしてください。');
      return;
    }
    
    setError(null);
    
    try {
      // ここで実際のデータ削除リクエストを送信する処理を実装
      // 現在はモックとして成功メッセージを表示
      
      // 実際の実装では以下のようなコードになります
      /*
      const response = await fetch('/api/data-deletion-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim() || (facebookUser?.email || ''),
          facebookId: facebookUser?.id || null,
          message: message.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('リクエストの送信に失敗しました');
      }
      */
      
      // 成功メッセージを表示
      setSubmitted(true);
      
      // フォームをリセット
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error('データ削除リクエスト送信エラー:', err);
      setError('リクエストの送信に失敗しました。後でもう一度お試しください。');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} className="mr-1" /> 戻る
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">データ削除リクエスト</h1>
        
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">リクエストを受け付けました</h2>
            <p className="text-green-700">
              データ削除リクエストを受け付けました。処理には数日かかる場合があります。
              ご質問がある場合は、<a href="mailto:contact@ht-sw.tech" className="underline">contact@ht-sw.tech</a> までお問い合わせください。
            </p>
          </div>
        ) : (
          <>
            <section className="mb-6">
              <p className="mb-4">
                Move Music Contentに保存されているあなたのデータの削除をリクエストするには、
                以下のフォームに必要事項を入力してください。
              </p>
              <p className="mb-4">
                データ削除リクエストが処理されると、以下のデータが削除されます：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>投稿したコンテンツ（画像、音声、動画など）</li>
                <li>コメント、いいねなどのインタラクション</li>
                <li>プロフィール情報</li>
                <li>その他の個人データ</li>
              </ul>
              <p className="text-red-600">
                注意: データ削除は元に戻すことができません。
              </p>
            </section>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス {isAuthenticated ? '(Facebookアカウントで自動入力)' : '(必須)'}
                </label>
                <input
                  type="email"
                  id="email"
                  value={isAuthenticated && facebookUser?.email ? facebookUser.email : email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isAuthenticated && !!facebookUser?.email}
                  required={!isAuthenticated}
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  追加情報（任意）
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="削除理由や特定のデータについての詳細など"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                データ削除をリクエスト
              </button>
            </form>
          </>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-2">その他のお問い合わせ</h2>
          <p>
            データ削除以外のお問い合わせについては、
            <a href="mailto:contact@ht-sw.tech" className="text-blue-600 hover:underline">contact@ht-sw.tech</a>
            までメールでご連絡ください。
          </p>
        </div>
      </div>
    </div>
  );
} 