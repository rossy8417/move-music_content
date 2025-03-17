import React, { createContext, useContext, useEffect, useState } from 'react';

// 型定義
interface FacebookLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse?: {
    accessToken: string;
    expiresIn: string;
    signedRequest: string;
    userID: string;
  };
}

interface FacebookUser {
  id: string;
  name?: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookAuthContextType {
  user: FacebookUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const FacebookAuthContext = createContext<FacebookAuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
});

export const useFacebookAuth = () => useContext(FacebookAuthContext);

export const FacebookAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FacebookUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージからユーザー情報を取得
    const storedUser = localStorage.getItem('facebook_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Facebookユーザー情報の解析エラー:', e);
        localStorage.removeItem('facebook_user');
      }
    }

    // Facebook SDKの初期化
    const initFacebookSDK = () => {
      if (window.FB) return;

      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '1874781283261928', // Metaダッシュボードに表示されているアプリID
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });

        console.log('Facebook SDKが初期化されました');

        // 既存のログインステータスをチェック
        window.FB.getLoginStatus((response) => {
          console.log('Facebookログインステータス:', response);
          if (response.status === 'connected') {
            fetchUserData();
          }
          setLoading(false);
        });
      };

      // Facebook SDKの読み込み
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/ja_JP/sdk.js";
        fjs.parentNode?.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    initFacebookSDK();
  }, []);

  const fetchUserData = async () => {
    if (!window.FB) return;

    try {
      const response = await new Promise<FacebookLoginStatusResponse>((resolve) => {
        window.FB.getLoginStatus(resolve);
      });

      if (response.status === 'connected') {
        const userData = await new Promise<FacebookUser>((resolve) => {
          window.FB.api('/me', { fields: 'id,name,email,picture' }, resolve);
        });
        
        console.log('Facebookユーザーデータ取得成功:', userData);
        setUser(userData);
        // ユーザーデータをローカルストレージに保存
        localStorage.setItem('facebook_user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('facebook_user');
      }
    } catch (error) {
      console.error('Facebookユーザーデータの取得に失敗:', error);
      setUser(null);
    }
  };

  const signIn = async () => {
    if (!window.FB) return;

    try {
      console.log('Facebookログインを開始します...');
      const response = await new Promise<FacebookLoginStatusResponse>((resolve) => {
        window.FB.login(resolve, { scope: 'public_profile,email' });
      });

      console.log('Facebookログイン結果:', response);
      if (response.status === 'connected') {
        await fetchUserData();
      }
    } catch (error) {
      console.error('Facebookログインエラー:', error);
    }
  };

  const signOut = async () => {
    if (!window.FB) return;

    try {
      console.log('Facebookログアウトを開始します...');
      
      // まずログイン状態を確認
      const loginStatus = await new Promise<FacebookLoginStatusResponse>((resolve) => {
        window.FB.getLoginStatus(resolve);
      });
      
      console.log('ログアウト前のステータス確認:', loginStatus);
      
      if (loginStatus.status === 'connected') {
        // 接続されている場合のみログアウトを実行
        await new Promise<void>((resolve) => {
          window.FB.logout(() => {
            console.log('FB.logoutが完了しました');
            resolve();
          });
        });
      } else {
        console.log('ログアウト不要: 既に接続されていません');
      }
      
      // ローカルのユーザー情報をクリア
      setUser(null);
      localStorage.removeItem('facebook_user');
      console.log('Facebookログアウト完了');
    } catch (error) {
      console.error('Facebookログアウトエラー:', error);
      // エラーが発生してもローカルのユーザー情報はクリア
      setUser(null);
      localStorage.removeItem('facebook_user');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <FacebookAuthContext.Provider value={value}>{children}</FacebookAuthContext.Provider>;
}; 