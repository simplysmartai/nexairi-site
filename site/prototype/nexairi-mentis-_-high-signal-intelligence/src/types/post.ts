export type Category = 'Lifestyle' | 'Technology' | 'Travel' | 'Sports' | 'Sports & Seasons';

export interface Post {
  id: string;
  title: string;
  slug: string;
  date: string; // ISO 8601
  author?: string;
  summary?: string;
  excerpt?: string;
  category: Category;
  subCategory?: string;
  league?: string;
  contentPath: string; // site-relative path like /content/sports/slug.html
  imageUrl?: string;
  isFeatured?: boolean;
  tags?: string[];
  readingTime?: number;
  tldr?: string;
  persona?: string;
  angle?: string;
  contentType?: string;
  archived?: boolean;
}

export default Post;
