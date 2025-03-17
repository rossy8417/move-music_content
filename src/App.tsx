import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
// Auth関連のインポートを削除
// import { Auth } from './pages/Auth';
// import { Profile } from './pages/Profile';
import { PostDetail } from './pages/PostDetail';
import { NewPost } from './pages/NewPost';
import { AuthCallback } from './pages/AuthCallback';
import { Privacy } from './pages/Privacy';
import { DataDeletion } from './pages/DataDeletion';
import { initializeStorage } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';
import { FacebookAuthProvider } from './contexts/FacebookAuthContext';

function App() {
  // アプリケーションの起動時にストレージバケットを初期化
  useEffect(() => {
    initializeStorage().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <FacebookAuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="container mx-auto px-4 py-8 flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                {/* Auth関連のルートを削除 */}
                {/* <Route path="/auth" element={<Auth />} /> */}
                {/* <Route path="/profile" element={<Profile />} /> */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/new-post" element={<NewPost />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/data-deletion" element={<DataDeletion />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </FacebookAuthProvider>
    </AuthProvider>
  );
}

export default App;