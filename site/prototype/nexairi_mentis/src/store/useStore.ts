import { create } from 'zustand';
import { Post, Category, AIStatus } from '../types';
import { contentService } from '../services/contentService';

interface Store {
  // Posts state
  posts: Post[];
  isLoading: boolean;
  activeCategory: Category | 'All';
  
  // AI status state
  aiStatus: AIStatus;
  
  // Actions
  fetchPosts: () => Promise<void>;
  setCategory: (category: Category | 'All') => void;
  triggerIngest: () => Promise<void>;
}

export const useStore = create<Store>((set) => ({
  // Initial state
  posts: [],
  isLoading: false,
  activeCategory: 'All',
  aiStatus: {
    activeAgents: 0,
    currentTask: 'Idle',
    lastUpdate: new Date().toISOString(),
    systemHealth: 100,
  },

  // Actions
  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      const posts = await contentService.fetchPosts();
      set({ posts, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      set({ isLoading: false });
    }
  },

  setCategory: (category: Category | 'All') => {
    set({ activeCategory: category });
  },

  triggerIngest: async () => {
    set((state) => ({
      aiStatus: {
        ...state.aiStatus,
        activeAgents: 1,
        currentTask: 'Processing new content...',
        lastUpdate: new Date().toISOString(),
        systemHealth: 95,
      },
    }));

    // Simulate ingest process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    set((state) => ({
      aiStatus: {
        ...state.aiStatus,
        activeAgents: 0,
        currentTask: 'Completed',
        lastUpdate: new Date().toISOString(),
        systemHealth: 100,
      },
    }));

    // Re-fetch posts after ingest
    const posts = await contentService.fetchPosts();
    set({ posts });
  },
}));
