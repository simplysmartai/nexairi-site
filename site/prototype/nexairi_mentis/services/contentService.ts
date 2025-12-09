import { Post } from '../types';
import { MOCK_POSTS, getMockContent } from '../mockData';

const CACHE_KEY_POSTS = 'nexairi_posts_cache';
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

interface CachedData {
  timestamp: number;
  data: Post[];
}

export const contentService = {
  /**
   * Fetches the post index. Tries public/posts.json first.
   * Falls back to local mock data on failure.
   */
  fetchPosts: async (): Promise<Post[]> => {
    // Check localStorage cache first
    const cached = localStorage.getItem(CACHE_KEY_POSTS);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached) as CachedData;
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    try {
      const response = await fetch('/posts.json');
      if (!response.ok) throw new Error('Failed to load posts manifest');
      
      const data: Post[] = await response.json();
      
      // Update cache
      localStorage.setItem(CACHE_KEY_POSTS, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
      
      return data;
    } catch (error) {
      console.warn('Nexairi: using mock data fallback', error);
      return MOCK_POSTS;
    }
  },

  /**
   * Fetches the HTML content for a specific post.
   */
  fetchContent: async (category: string, slug: string, title: string): Promise<string> => {
    try {
      const path = `/content/${category}/${slug}.html`;
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Content not found: ${path}`);
      }
      
      return await response.text();
    } catch (error) {
      console.warn(`Nexairi: Mocking content for ${slug}`);
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 600));
      return getMockContent(slug, title);
    }
  }
};