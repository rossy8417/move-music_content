import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Move Music Content. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-600 hover:text-blue-600 text-sm">
              プライバシーポリシー
            </Link>
            <Link to="/data-deletion" className="text-gray-600 hover:text-blue-600 text-sm">
              データ削除
            </Link>
            <a 
              href="mailto:contact@ht-sw.tech" 
              className="text-gray-600 hover:text-blue-600 text-sm"
            >
              お問い合わせ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 