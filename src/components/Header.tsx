import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, Video, MessageSquare, Image, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FacebookAuth } from './FacebookAuth';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut, loading } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Move & Music Contest</span>
          </Link>

          {/* デスクトップ用ナビゲーション (md:768px以上で表示) */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/?category=character" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
              <Image size={20} />
              <span>Characters</span>
            </Link>
            <Link to="/?category=music" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
              <Music size={20} />
              <span>Music</span>
            </Link>
            <Link to="/?category=talk" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
              <MessageSquare size={20} />
              <span>Talk</span>
            </Link>
            <Link to="/?category=video" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
              <Video size={20} />
              <span>Video</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {/* モバイル用ハンバーガーメニューボタン (md:768px未満で表示) */}
            <button 
              className="md:hidden text-gray-600 hover:text-gray-900 focus:outline-none" 
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* 認証状態に応じたボタン表示 */}
            {loading ? (
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    <User size={16} />
                  </div>
                )}
                <span className="text-sm hidden md:inline-block">
                  {user?.user_metadata?.full_name || user?.email || 'ユーザー'}
                </span>
                <button 
                  onClick={signOut}
                  className="text-gray-600 hover:text-gray-900"
                  title="ログアウト"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="hidden md:block">
                <FacebookAuth />
              </div>
            )}
            
            <Link to="/new-post" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              New Post
            </Link>
          </div>
        </div>

        {/* モバイル用ドロップダウンメニュー */}
        {isMenuOpen && (
          <div className="md:hidden py-2 border-t border-gray-200">
            <div className="flex flex-col space-y-3 py-3">
              <Link 
                to="/?category=character" 
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <Image size={20} />
                <span>Characters</span>
              </Link>
              <Link 
                to="/?category=music" 
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <Music size={20} />
                <span>Music</span>
              </Link>
              <Link 
                to="/?category=talk" 
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageSquare size={20} />
                <span>Talk</span>
              </Link>
              <Link 
                to="/?category=video" 
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <Video size={20} />
                <span>Video</span>
              </Link>
              
              {/* モバイル用ログインボタン */}
              {!isAuthenticated && !loading && (
                <div className="px-4 py-2">
                  <FacebookAuth />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}