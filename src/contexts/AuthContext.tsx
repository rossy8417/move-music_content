import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージからユーザー情報を取得
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('ユーザー情報の解析エラー:', e);
        localStorage.removeItem('user');
      }
    }

    // 現在のセッションを確認
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('セッション取得エラー:', error);
          return;
        }
        
        if (data.session) {
          setUser(data.session.user);
          localStorage.setItem('user', JSON.stringify(data.session.user));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('セッション確認エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session);
        
        if (session) {
          setUser(session.user);
          localStorage.setItem('user', JSON.stringify(session.user));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('ログアウトエラー:', error);
        return;
      }
      
      setUser(null);
      localStorage.removeItem('user');
    } catch (err) {
      console.error('ログアウト処理エラー:', err);
    }
  };

  const value = {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 