
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  // Optional fields for layout control
  isFeatured?: boolean; 
  series?: string;     // e.g. "Thanksgiving Series" or "Winter Tech"
}

export interface NavItem {
  label: string;
  href: string;
}
