import { ApiClient } from './client';
import { PostResponse, APIPost, Comment, CreatePostRequest, UpdatePostRequest, PostsResponse, Post, Bookmark } from './types';

declare module './client' {
  interface ApiClient {
    // Posts endpoints
    getFeed(limit?: number, offset?: number, filter?: string): Promise<{ posts: PostResponse[]; limit: number; offset: number }>;
    getAllFeed(limit?: number, offset?: number): Promise<{ posts: PostResponse[]; limit: number; offset: number }>;
    getFollowingFeed(limit?: number, offset?: number): Promise<{ posts: PostResponse[]; limit: number; offset: number }>;
    getFriendsFeed(limit?: number, offset?: number): Promise<{ posts: PostResponse[]; limit: number; offset: number }>;
    getPosts(): Promise<PostsResponse>;
    getPost(id: number, sort?: 'newest' | 'oldest'): Promise<APIPost>;
    updatePost(id: number, data: UpdatePostRequest): Promise<{ message: string }>;
    deletePost(id: number): Promise<{ message: string }>;
    createPost(data: CreatePostRequest): Promise<PostResponse>;
    likePost(postId: number): Promise<{ success: boolean }>;
    unlikePost(postId: number): Promise<{ success: boolean }>;
    dislikePost(postId: number): Promise<{ success: boolean }>;
    undislikePost(postId: number): Promise<{ success: boolean }>;
    toggleBookmark(id: number): Promise<{ message: string; is_bookmarked: boolean }>;
    unbookmarkPost(id: number): Promise<{ message: string }>;
    checkBookmarkStatus(id: number): Promise<{ is_bookmarked: boolean }>;
    getUserBookmarks(limit?: number, offset?: number): Promise<{ bookmarks: Bookmark[]; count: number }>;
    getPostComments(postId: number, limit?: number, offset?: number): Promise<{ comments: Comment[], count: number, post_id: number }>;
    createComment(postId: number, data: { content: string; image_url?: string }): Promise<{ message: string; comment: Comment }>;
    getUserPosts(userId: number, limit?: number, offset?: number): Promise<{ posts: Post[], count: number, limit: number, offset: number }>;
    getUserLikedPosts(limit?: number, offset?: number): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }>;
    getUserCommentedPosts(limit?: number, offset?: number): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }>;
  }
}

ApiClient.prototype.getFeed = async function(limit: number = 20, offset: number = 0, filter?: string): Promise<{ posts: PostResponse[]; limit: number; offset: number }> {
  let url = `/api/feed?limit=${limit}&offset=${offset}`;
  if (filter) {
    url += `&filter=${filter}`;
  }
  return this.request<{ limit: number; offset: number; posts: PostResponse[] }>(url, {
    method: 'GET',
  });
};

ApiClient.prototype.getAllFeed = async function(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[]; limit: number; offset: number }> {
  return this.getFeed(limit, offset, 'all');
};

ApiClient.prototype.getFollowingFeed = async function(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[]; limit: number; offset: number }> {
  return this.getFeed(limit, offset, 'following');
};

ApiClient.prototype.getFriendsFeed = async function(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[]; limit: number; offset: number }> {
  return this.getFeed(limit, offset, 'friends');
};

ApiClient.prototype.getPosts = async function(): Promise<PostsResponse> {
  return this.request<PostsResponse>('/api/posts', {
    method: 'GET',
  });
};

ApiClient.prototype.getPost = async function(id: number, sort?: 'newest' | 'oldest'): Promise<APIPost> {
  const params = new URLSearchParams();
  if (sort) {
    params.append('sort', sort);
  }
  const queryString = params.toString();
  const url = queryString ? `/api/posts/${id}?${queryString}` : `/api/posts/${id}`;
  return this.request<APIPost>(url, {
    method: 'GET',
  });
};

ApiClient.prototype.updatePost = async function(id: number, data: UpdatePostRequest): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.deletePost = async function(id: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/posts/${id}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.createPost = async function(data: CreatePostRequest): Promise<PostResponse> {
  return this.request<PostResponse>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.likePost = async function(postId: number): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(`/api/posts/${postId}/like`, {
    method: 'POST',
  });
};

ApiClient.prototype.unlikePost = async function(postId: number): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(`/api/posts/${postId}/like`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.dislikePost = async function(postId: number): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(`/api/posts/${postId}/dislike`, {
    method: 'POST',
  });
};

ApiClient.prototype.undislikePost = async function(postId: number): Promise<{ success: boolean }> {
  return this.request<{ success: boolean }>(`/api/posts/${postId}/dislike`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.toggleBookmark = async function(id: number): Promise<{ message: string; is_bookmarked: boolean }> {
  return this.request<{ message: string; is_bookmarked: boolean }>(`/api/bookmarks/${id}`, {
    method: 'POST',
  });
};

ApiClient.prototype.unbookmarkPost = async function(id: number): Promise<{ message: string }> {
  return this.request<{ message: string }>(`/api/bookmarks/${id}`, {
    method: 'DELETE',
  });
};

ApiClient.prototype.checkBookmarkStatus = async function(id: number): Promise<{ is_bookmarked: boolean }> {
  return this.request<{ is_bookmarked: boolean }>(`/api/bookmarks/${id}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getUserBookmarks = async function(limit: number = 20, offset: number = 0): Promise<{ bookmarks: Bookmark[]; count: number }> {
  return this.request<{ bookmarks: Bookmark[]; count: number }>(`/api/bookmarks?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getPostComments = async function(postId: number, limit: number = 20, offset: number = 0): Promise<{ comments: Comment[], count: number, post_id: number }> {
  return this.request<{ comments: Comment[], count: number, post_id: number }>(`/api/posts/${postId}/comments?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.createComment = async function(postId: number, data: { content: string; image_url?: string }): Promise<{ message: string; comment: Comment }> {
  return this.request<{ message: string; comment: Comment }>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

ApiClient.prototype.getUserPosts = async function(userId: number, limit: number = 20, offset: number = 0): Promise<{ posts: Post[], count: number, limit: number, offset: number }> {
  const response = await this.request<{ posts: PostResponse[], count: number, limit: number, offset: number }>(`/api/posts/user/${userId}?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });

  // Ensure posts is an array
  const posts = response.posts || [];

  // Transform PostResponse[] to Post[]
  const transformedPosts: Post[] = posts.map(postResponse => ({
    id: postResponse.id,
    user: {
      id: postResponse.user.id,
      name: `${postResponse.user.first_name} ${postResponse.user.last_name}`,
      username: postResponse.user.nickname || postResponse.user.email.split('@')[0],
      avatar: postResponse.user.avatar,
    },
    content: postResponse.content,
    image: postResponse.image_url,
    likes: postResponse.like_count,
    comments: postResponse.comment_count,
    shares: postResponse.share_count,
    timeAgo: this.formatTimeAgo(new Date(postResponse.created_at)),
    privacy: postResponse.privacy,
    isLiked: Boolean(postResponse.is_liked),
    isBookmarked: Boolean(postResponse.is_bookmarked),
    created_at: postResponse.created_at,
  }));

  return {
    posts: transformedPosts,
    count: response.count || 0,
    limit: response.limit || limit,
    offset: response.offset || offset,
  };
};

ApiClient.prototype.getUserLikedPosts = async function(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }> {
  return this.request<{ posts: PostResponse[], count: number, limit: number, offset: number }>(`/api/posts/liked?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};

ApiClient.prototype.getUserCommentedPosts = async function(limit: number = 20, offset: number = 0): Promise<{ posts: PostResponse[], count: number, limit: number, offset: number }> {
  return this.request<{ posts: PostResponse[], count: number, limit: number, offset: number }>(`/api/posts/commented?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });
};