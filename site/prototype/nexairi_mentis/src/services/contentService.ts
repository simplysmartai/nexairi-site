import { Post } from '../types';
import { MOCK_POSTS, getMockContent } from '../mockData';

const CACHE_KEY_POSTS = 'nexairi_posts_cache';
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

interface CachedData {
  timestamp: number;
  data: Post[];
}

// Images for auto-assignment if missing in legacy posts
const FALLBACK_IMAGES: Record<string, string> = {
  Technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  Sports: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&w=800&q=80",
  Travel: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  Lifestyle: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
  Default: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80"
};

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
      
      const rawData: any[] = await response.json();
      
      // NORMALIZE LEGACY DATA
      // If user uploads an old posts.json, this ensures the app doesn't crash
      const data: Post[] = rawData.map(post => ({
        ...post,
        imageUrl: post.imageUrl || FALLBACK_IMAGES[post.category as keyof typeof FALLBACK_IMAGES] || FALLBACK_IMAGES.Default,
        author: post.author || "Nexairi Agent",
        readingTime: post.readingTime || Math.ceil((post.summary?.length || 500) / 200),
        isFeatured: post.isFeatured !== undefined ? post.isFeatured : false,
        tags: post.tags || [post.category, "Legacy"],
        summary: post.summary || "No summary available for this archived dispatch.",
        views: post.views || Math.floor(Math.random() * 500)
      }));
      
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
      // Normalize category for folder structure (some legacy folders might be capitalized differently)
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