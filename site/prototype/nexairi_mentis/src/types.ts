export type Category = 'Lifestyle' | 'Technology' | 'Travel' | 'Sports';

export interface Post {
  title: string;
  slug: string;
  category: Category;
  date: string; // ISO string
  summary: string;
  imageUrl: string;
  author: string;
  readingTime: number; // in minutes
  isFeatured: boolean;
  tags: string[];
  views?: number;
}

export interface AIStatus {
  activeAgents: number;
  currentTask: string;
  lastUpdate: string;
  systemHealth: number; // 0-100
}

export interface NavItem {
  label: string;
  path: string;
  category?: Category;
}