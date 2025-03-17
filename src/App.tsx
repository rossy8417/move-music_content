import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
// Auth関連のインポートを削除
// import { Auth } from './pages/Auth';
// import { Profile } from './pages/Profile';
import { PostDetail } from './pages/PostDetail';
import { NewPost } from './pages/NewPost';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Auth関連のルートを削除 */}
            {/* <Route path="/auth" element={<Auth />} /> */}
            {/* <Route path="/profile" element={<Profile />} /> */}
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/new-post" element={<NewPost />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;