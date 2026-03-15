export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  status: BlogPostStatus;
  featured: boolean;
  authorName: string;
  authorRole?: string;
  readTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
