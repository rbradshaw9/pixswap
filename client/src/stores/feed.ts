import { create } from 'zustand';
import type { Media, FeedState, FeedParams } from '@/types';
import { mediaService } from '@/services/media';

interface FeedStore extends FeedState {
  loadFeed: (params?: FeedParams, reset?: boolean) => Promise<void>;
  loadTrending: (params?: FeedParams, reset?: boolean) => Promise<void>;
  searchMedia: (query: string, reset?: boolean) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  addPost: (post: Media) => void;
  removePost: (postId: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  posts: [],
  isLoading: false,
  hasMore: true,
  page: 1,
  error: null,

  loadFeed: async (params = {}, reset = false) => {
    const { page: currentPage, isLoading } = get();
    if (isLoading) return;

    const pageToLoad = reset ? 1 : currentPage;
    set({ isLoading: true, error: null });

    try {
      const response = await mediaService.getFeed({
        ...params,
        page: pageToLoad,
        limit: 20,
      });

      if (response.success) {
        set((state) => ({
          posts: reset ? response.data : [...state.posts, ...response.data],
          page: pageToLoad + 1,
          hasMore: response.pagination.hasNext,
          isLoading: false,
        }));
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load feed',
        isLoading: false,
      });
    }
  },

  loadTrending: async (params = {}, reset = false) => {
    const { page: currentPage, isLoading } = get();
    if (isLoading) return;

    const pageToLoad = reset ? 1 : currentPage;
    set({ isLoading: true, error: null });

    try {
      const response = await mediaService.getTrendingFeed({
        ...params,
        page: pageToLoad,
        limit: 20,
      });

      if (response.success) {
        set((state) => ({
          posts: reset ? response.data : [...state.posts, ...response.data],
          page: pageToLoad + 1,
          hasMore: response.pagination.hasNext,
          isLoading: false,
        }));
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load trending',
        isLoading: false,
      });
    }
  },

  searchMedia: async (query: string, reset = false) => {
    const { page: currentPage, isLoading } = get();
    if (isLoading) return;

    const pageToLoad = reset ? 1 : currentPage;
    set({ isLoading: true, error: null });

    try {
      const response = await mediaService.searchMedia(query, pageToLoad, 20);

      if (response.success) {
        set((state) => ({
          posts: reset ? response.data : [...state.posts, ...response.data],
          page: pageToLoad + 1,
          hasMore: response.pagination.hasNext,
          isLoading: false,
        }));
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false,
      });
    }
  },

  likePost: async (postId: string) => {
    try {
      await mediaService.likeMedia(postId);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? { ...post, isLiked: true, likesCount: post.likesCount + 1 }
            : post
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to like post',
      });
    }
  },

  unlikePost: async (postId: string) => {
    try {
      await mediaService.unlikeMedia(postId);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? { ...post, isLiked: false, likesCount: Math.max(0, post.likesCount - 1) }
            : post
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to unlike post',
      });
    }
  },

  addPost: (post: Media) => {
    set((state) => ({
      posts: [post, ...state.posts],
    }));
  },

  removePost: (postId: string) => {
    set((state) => ({
      posts: state.posts.filter((post) => post._id !== postId),
    }));
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    posts: [],
    isLoading: false,
    hasMore: true,
    page: 1,
    error: null,
  }),
}));