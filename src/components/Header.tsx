import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Video, MessageSquare, Image } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Move & Music Contest</span>
          </Link>

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
            <Link to="/new-post" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              New Post
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}