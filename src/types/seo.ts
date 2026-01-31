// SEO Types

export type SchemaType = 'BlogPosting' | 'Product' | 'FAQPage' | 'BreadcrumbList' | 'Person' | 'Organization' | 'WebPage' | 'ItemList';

export interface SEOPageData {
  title: string;
  description: string;
  canonical: string | null;
  noIndex: boolean;
  noFollow: boolean;
  ogImage: string | null;
  ogType: 'website' | 'article' | 'profile';
  twitterCard: 'summary' | 'summary_large_image';
  schema: SchemaType[];
  focusKeyword: string;
  keywords: string[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export interface InternalLink {
  targetUrl: string;
  anchorText: string;
  relevanceScore: number;
  linkType: 'pillar' | 'hub' | 'cluster' | 'related';
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface VideoEmbedData {
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  uploadDate: string | null;
  duration: string | null;
}

export interface ComparisonTableColumn {
  id: string;
  header: string;
}

export interface ComparisonTableRow {
  id: string;
  cells: Record<string, string>;
}

export interface ComparisonTableData {
  columns: ComparisonTableColumn[];
  rows: ComparisonTableRow[];
}

export interface SEOStats {
  totalPages: number;
  indexedPages: number;
  noIndexPages: number;
  emptyPages: number;
  thinPages: number;
  missingMeta: number;
  brokenLinks: number;
  hubCount: number;
  pillarCount: number;
  programmaticCount: number;
}

export interface BrokenLink {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  status: 'broken' | 'redirect' | 'timeout';
}

export interface SEOAuditItem {
  pageId: string;
  pageType: string;
  url: string;
  title: string;
  issues: SEOIssue[];
  score: number;
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field: string;
}

// Author for E-E-A-T
export interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string;
  credentials: string;
  image: string | null;
  socialLinks: AuthorSocialLinks;
  expertise: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorSocialLinks {
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
  youtube: string | null;
  instagram: string | null;
}

// Hub Structure
export interface Hub {
  id: string;
  name: string;
  slug: string;
  parentHubId: string | null;
  seoTitle: string;
  metaDescription: string;
  description: string;
  featuredImage: string | null;
  linkedPillars: string[];
  sortOrder: number;
  noIndex: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pillar Page
export interface PillarPage {
  id: string;
  title: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  content: string;
  featuredImage: string | null;
  linkedHubs: string[];
  linkedClusters: string[];
  faqItems: FAQItem[];
  comparisonTable: ComparisonTableData | null;
  videoEmbeds: VideoEmbedData[];
  tocEnabled: boolean;
  noIndex: boolean;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Programmatic Page
export interface ProgrammaticTemplate {
  id: string;
  templateName: string;
  urlPattern: string;
  titlePattern: string;
  metaDescriptionPattern: string;
  linkedHub: string | null;
  linkedPillar: string | null;
  createdAt: string;
}

export interface ProgrammaticPage {
  id: string;
  templateId: string;
  genre: string;
  genreSlug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  content: string;
  hasContent: boolean;
  noIndex: boolean;
  linkedHub: string | null;
  linkedPillar: string | null;
  relatedPages: string[];
  createdAt: string;
  updatedAt: string;
}

// Resource/Asset Page
export interface ResourcePage {
  id: string;
  title: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  description: string;
  resourceType: 'sample-pack' | 'preset' | 'cheatsheet' | 'template' | 'tool';
  downloadUrl: string | null;
  fileSize: string | null;
  thumbnailUrl: string | null;
  embedCode: string | null;
  noIndex: boolean;
  createdAt: string;
  updatedAt: string;
}

// Extended Settings for SEO
export interface SEOSettings {
  defaultCanonicalBase: string;
  robotsTxtContent: string;
  sitemapEnabled: boolean;
  sitemapChangefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  sitemapPriority: {
    home: number;
    hub: number;
    pillar: number;
    blog: number;
    programmatic: number;
    resource: number;
    author: number;
  };
  defaultOgImage: string | null;
  twitterHandle: string | null;
  organizationName: string;
  organizationLogo: string | null;
  minContentLength: number;
  autoNoIndexEmpty: boolean;
}

export const defaultSEOSettings: SEOSettings = {
  defaultCanonicalBase: '',
  robotsTxtContent: `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/

Sitemap: /sitemap.xml`,
  sitemapEnabled: true,
  sitemapChangefreq: 'weekly',
  sitemapPriority: {
    home: 1.0,
    hub: 0.9,
    pillar: 0.9,
    blog: 0.7,
    programmatic: 0.6,
    resource: 0.8,
    author: 0.5,
  },
  defaultOgImage: null,
  twitterHandle: null,
  organizationName: '',
  organizationLogo: null,
  minContentLength: 300,
  autoNoIndexEmpty: true,
};
