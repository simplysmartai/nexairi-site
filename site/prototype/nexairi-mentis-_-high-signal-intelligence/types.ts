
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  content?: string; // HTML content
  // Optional fields for layout control
  isFeatured?: boolean; 
  series?: string;     // e.g. "Thanksgiving Series"
  seriesLabel?: string; // e.g. "Day 1", "Day 2"
}

export interface NavItem {
  label: string;
  href: string;
}
