export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
}

export interface NavItem {
  label: string;
  href: string;
}