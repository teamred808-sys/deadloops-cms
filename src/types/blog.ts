// Blog Types
import { FAQItem, InternalLink } from './seo';

export type PageType = 'blog' | 'hub' | 'pillar' | 'programmatic' | 'resource';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  author: string;
  status: 'draft' | 'published';
  publishDate: string;
  categories: string[];
  tags: string[];
  downloadEnabled: boolean;
  downloadUrl: string | null;
  downloadFilename: string | null;
  downloadSize: string | null;
  downloadCount: number;
  metaDescription: string;
  createdAt: string;
  updatedAt: string;
  // SEO Fields
  pageType?: PageType;
  seoTitle?: string;
  canonicalUrl?: string | null;
  noIndex?: boolean;
  focusKeyword?: string;
  breadcrumbLabel?: string;
  internalLinks?: InternalLink[];
  tocEnabled?: boolean;
  faqSchema?: FAQItem[];
  authorId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Media {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  uploadedAt: string;
}

export interface Settings {
  siteTitle: string;
  tagline: string;
  logo: string | null;
  postsPerPage: number;
  downloadTimerDuration: number;
  adBlockerDetectionEnabled: boolean;
  adBlockerMessage: string;
  googleAdsEnabled: boolean;
  googleAdsClientId: string;
  googleAdsDisplaySlotId: string;
  googleAdsInFeedSlotId: string;
  googleAdsInArticleSlotId: string;
  googleAdsMultiplexSlotId: string;
  googleAdsCode: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Omit<User, 'passwordHash'> | null;
  token: string | null;
}

export interface Stats {
  totalPosts: number;
  totalDownloads: number;
  postsThisMonth: number;
  totalMedia: number;
  totalCategories: number;
}

// Analytics types
export interface AnalyticsSummary {
  visitors_today: number;
  visitors_yesterday: number;
  visitors_7d: number;
  visitors_30d: number;
  live_visitors: number;
  last_updated: string;
}

export interface DailyVisitorData {
  date: string;
  unique_visitors: number;
  total_pageviews: number;
}

export interface LiveSession {
  session_id: string;
  last_active_at: string;
  current_page: string;
  device_type: string;
}

export interface DailyVisitorRecord {
  date: string;
  unique_visitors: number;
  total_pageviews: number;
  sessions: string[];
  last_updated: string;
}

// Footer Pages
export interface FooterPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle: string;
  metaDescription: string;
  status: 'draft' | 'published';
  showInFooter: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  status: 'draft' | 'published';
  publishDate: string;
  categories: string[];
  tags: string[];
  downloadEnabled: boolean;
  downloadUrl: string | null;
  downloadFilename: string | null;
  downloadSize: string | null;
  metaDescription: string;
  slug: string;
  // SEO Fields
  seoTitle?: string;
  canonicalUrl?: string | null;
  noIndex?: boolean;
  focusKeyword?: string;
  tocEnabled?: boolean;
  faqSchema?: FAQItem[];
  authorId?: string | null;
}
