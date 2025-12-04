
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  tags?: string[];
  summary?: string;
  contentFile?: string;
  content?: string; // HTML content for legacy inline posts
  isFeatured?: boolean;
  series?: string;
  seriesLabel?: string;
}

export interface NavItem {
  label: string;
  href: string;
}
