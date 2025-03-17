import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Post, Comment, Profile } from '../types/database';
import { MessageSquare, ThumbsUp, Vote } from 'lucide-react';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [comments, setComments] = useState<(Comment & { author: Profile })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [votesCount, setVotesCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchPostData() {
      setLoading(true);
      
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        setLoading(false);
        return;
      }

      setPost(postData);

      // Fetch author
      const { data: authorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', postData.user_id)
        .single();

      setAuthor(authorData);

      // Fetch comments with authors
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: false });

      setComments(commentsData || []);

      // Fetch votes count
      const { count: votesCountData } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id);

      setVotesCount(votesCountData || 0);

      // Fetch likes count
      const { count: likesCountData } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id);

      setLikesCount(likesCountData || 0);

      if (user) {
        // Check if user has voted
        const { data: voteData } = await supabase
          .from('votes')
          .select('*')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .single();

        setHasVoted(!!voteData);

        // Check if user has liked
        const { data: likeData } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .single();

        setHasLiked(!!likeData);
      }

      setLoading(false);
    }

    fetchPostData();
  }, [id, user]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: id,
        user_id: user.id,
        content: newComment.trim(),
      });

    if (!error) {
      setNewComment('');
      // Refresh comments
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: false });

      setComments(data || []);
    }
  };

  const handleVote = async () => {
    if (!user || !id) return;

    if (hasVoted) {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id);

      if (!error) {
        setHasVoted(false);
        setVotesCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('votes')
        .insert({
          post_id: id,
          user_id: user.id,
        });

      if (!error) {
        setHasVoted(true);
        setVotesCount(prev => prev + 1);
      }
    }
  };

  const handleLike = async () => {
    if (!user || !id) return;

    if (hasLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id);

      if (!error) {
        setHasLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: id,
          user_id: user.id,
        });

      if (!error) {
        setHasLiked(true);
        setLikesCount(prev => prev + 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!post || !author) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Post not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              {author.avatar_url && (
                <img
                  src={author.avatar_url}
                  alt={author.username}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="font-medium">{author.username}</span>
            </div>
            <span className="text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>

          {post.description && (
            <p className="text-gray-700 mb-6 whitespace-pre-wrap">{post.description}</p>
          )}

          {post.file_url && (
            <div className="mb-6">
              {post.category === 'character' && (
                <img
                  src={post.file_url}
                  alt={post.title}
                  className="max-w-full rounded-lg"
                />
              )}
              {post.category === 'music' && (
                <audio
                  src={post.file_url}
                  controls
                  className="w-full"
                />
              )}
              {post.category === 'video' && (
                <video
                  src={post.file_url}
                  controls
                  className="w-full rounded-lg"
                />
              )}
            </div>
          )}

          {post.external_url && (
            <div className="mb-6">
              <a
                href={post.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View External Content
              </a>
            </div>
          )}

          <div className="flex items-center space-x-6 border-t border-gray-200 pt-6">
            <button
              onClick={handleVote}
              className={`flex items-center space-x-2 ${
                hasVoted ? 'text-blue-600' : 'text-gray-600'
              } hover:text-blue-800`}
            >
              <Vote size={20} />
              <span>{votesCount} votes</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                hasLiked ? 'text-red-600' : 'text-gray-600'
              } hover:text-red-800`}
            >
              <ThumbsUp size={20} />
              <span>{likesCount} likes</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-600">
              <MessageSquare size={20} />
              <span>{comments.length} comments</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>

        {user ? (
          <form onSubmit={handleComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
              rows={3}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p className="text-gray-600 mb-8">Please sign in to comment.</p>
        )}

        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4 mb-4">
                {comment.author.avatar_url && (
                  <img
                    src={comment.author.avatar_url}
                    alt={comment.author.username}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium">{comment.author.username}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}