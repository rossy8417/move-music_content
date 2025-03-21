export type PostCategory = 'character' | 'music' | 'talk' | 'video';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: PostCategory;
  file_url: string | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar_url?: string;
  facebook_id?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  commenter_name?: string;
  commenter_avatar_url?: string;
}

export interface Vote {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}