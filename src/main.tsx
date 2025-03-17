import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeStorage } from './lib/supabase';

// Supabaseストレージを初期化
console.log('Supabaseストレージの初期化を開始します...');
initializeStorage().catch(error => {
  console.error('Supabaseストレージの初期化に失敗しました:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
