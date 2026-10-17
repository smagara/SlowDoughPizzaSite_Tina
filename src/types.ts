export interface MenuItem {
  id: string;
  name: string;
  italianName?: string;
  description: string;
  price: number;
  tags?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
}

export interface MenuCategory {
  id: string;
  title: string;
  subtitle: string;
  items: MenuItem[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  authorRole: string;
  readTime: string;
  publishedDate: string;
  excerpt: string;
  artType: 'dough' | 'oven';
  content: {
    sectionHeading?: string;
    paragraphs: string[];
    quote?: string;
  }[];
  keyTakeaways: string[];
}

export interface StoreHours {
  day: string;
  hours: string;
  statusNote?: string;
  isClosed?: boolean;
}
