import { create } from 'zustand';
import { Post, AIStatus, Category } from '../types';
import { contentService } from '../services/contentService';

interface AppState {
  posts: Post[];
  isLoading: boolean;
  aiStatus: AIStatus;
  activeCategory: Category | 'All';
  
  // Actions
  fetchPosts: () => Promise<void>;
  setCategory: (cat: Category | 'All') => void;
  updateAIStatus: (status: Partial<AIStatus>) => void;
  triggerIngest: (category: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  posts: [],
  isLoading: true,
  activeCategory: 'All',
  aiStatus: {
    activeAgents: 4,
    currentTask: 'Monitoring global news feeds...',
    lastUpdate: new Date().toLocaleTimeString(),
    systemHealth: 100,
  },

  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      const posts = await contentService.fetchPosts();
      // Sort by date descending
      const sorted = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ posts: sorted, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  setCategory: (cat) => set({ activeCategory: cat }),

  updateAIStatus: (newStatus) => 
    set((state) => ({ 
      aiStatus: { ...state.aiStatus, ...newStatus } 
    })),

  triggerIngest: async (category) => {
    // Simulate an AI ingest process
    set((state) => ({
      aiStatus: { 
        ...state.aiStatus, 
        currentTask: `Ingesting source data for ${category}...`,
        activeAgents: state.aiStatus.activeAgents + 2
      }
    }));

    await new Promise(resolve => setTimeout(resolve, 3000));

    set((state) => ({
      aiStatus: { 
        ...state.aiStatus, 
        currentTask: 'Idle: Monitoring feeds...',
        activeAgents: Math.max(2, state.aiStatus.activeAgents - 2),
        lastUpdate: new Date().toLocaleTimeString()
      }
    }));
  }
}));