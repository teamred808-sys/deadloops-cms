// XML Sitemap Generator

import { Post } from '@/types/blog';
import { Hub, PillarPage, ProgrammaticPage, ResourcePage, Author, SEOSettings, defaultSEOSettings } from '@/types/seo';
import { getStorageItem, STORAGE_KEYS } from './storage';
import { shouldNoIndexPost, shouldNoIndexPillar, shouldNoIndexProgrammatic, shouldNoIndexHub, shouldNoIndexResource } from './indexControl';
import { getCanonicalBase } from './canonical';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

// Get SEO settings
function getSEOSettings(): SEOSettings {
  return getStorageItem<SEOSettings>(STORAGE_KEYS.SEO_SETTINGS, defaultSEOSettings);
}

// Generate sitemap entries for posts
function getPostEntries(): SitemapEntry[] {
  const posts = getStorageItem<Post[]>(STORAGE_KEYS.POSTS, []);
  const settings = getSEOSettings();

  return posts
    .filter(post => post.status === 'published' && !shouldNoIndexPost(post))
    .map(post => ({
      loc: `/${post.slug}`,
      lastmod: post.updatedAt || post.createdAt,
      changefreq: settings.sitemapChangefreq,
      priority: settings.sitemapPriority.blog,
    }));
}

// Generate sitemap entries for hubs
function getHubEntries(): SitemapEntry[] {
  const hubs = getStorageItem<Hub[]>(STORAGE_KEYS.HUBS, []);
  const settings = getSEOSettings();

  return hubs
    .filter(hub => !shouldNoIndexHub(hub))
    .map(hub => ({
      loc: `/${hub.slug}`,
      lastmod: hub.updatedAt || hub.createdAt,
      changefreq: 'weekly' as const,
      priority: settings.sitemapPriority.hub,
    }));
}

// Generate sitemap entries for pillars
function getPillarEntries(): SitemapEntry[] {
  const pillars = getStorageItem<PillarPage[]>(STORAGE_KEYS.PILLARS, []);
  const settings = getSEOSettings();

  return pillars
    .filter(pillar => !shouldNoIndexPillar(pillar))
    .map(pillar => ({
      loc: `/${pillar.slug}`,
      lastmod: pillar.updatedAt || pillar.createdAt,
      changefreq: 'weekly' as const,
      priority: settings.sitemapPriority.pillar,
    }));
}

// Generate sitemap entries for programmatic pages
function getProgrammaticEntries(): SitemapEntry[] {
  const pages = getStorageItem<ProgrammaticPage[]>(STORAGE_KEYS.PROGRAMMATIC, []);
  const settings = getSEOSettings();

  return pages
    .filter(page => !shouldNoIndexProgrammatic(page))
    .map(page => ({
      loc: `/genre/${page.genreSlug}/${page.templateId}`,
      lastmod: page.updatedAt || page.createdAt,
      changefreq: 'monthly' as const,
      priority: settings.sitemapPriority.programmatic,
    }));
}

// Generate sitemap entries for resources
function getResourceEntries(): SitemapEntry[] {
  const resources = getStorageItem<ResourcePage[]>(STORAGE_KEYS.RESOURCES, []);
  const settings = getSEOSettings();

  return resources
    .filter(resource => !shouldNoIndexResource(resource))
    .map(resource => ({
      loc: `/resources/${resource.slug}`,
      lastmod: resource.updatedAt || resource.createdAt,
      changefreq: 'monthly' as const,
      priority: settings.sitemapPriority.resource,
    }));
}

// Generate sitemap entries for authors
function getAuthorEntries(): SitemapEntry[] {
  const authors = getStorageItem<Author[]>(STORAGE_KEYS.AUTHORS, []);
  const settings = getSEOSettings();

  return authors.map(author => ({
    loc: `/author/${author.slug}`,
    lastmod: author.updatedAt || author.createdAt,
    changefreq: 'monthly' as const,
    priority: settings.sitemapPriority.author,
  }));
}

// Get all sitemap entries
export function getAllSitemapEntries(): SitemapEntry[] {
  const settings = getSEOSettings();

  const entries: SitemapEntry[] = [
    // Home page
    {
      loc: '/',
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: settings.sitemapPriority.home,
    },
    // About page
    {
      loc: '/about',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.5,
    },
    ...getHubEntries(),
    ...getPillarEntries(),
    ...getPostEntries(),
    ...getProgrammaticEntries(),
    ...getResourceEntries(),
    ...getAuthorEntries(),
  ];

  return entries;
}

// Generate XML sitemap string
export function generateSitemapXml(): string {
  const baseUrl = getCanonicalBase();
  const entries = getAllSitemapEntries();

  const urlEntries = entries.map(entry => {
    const fullUrl = `${baseUrl}${entry.loc}`;
    const lastmod = entry.lastmod.split('T')[0]; // Format as YYYY-MM-DD

    return `  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Get sitemap stats
export function getSitemapStats(): {
  total: number;
  byType: Record<string, number>;
} {
  return {
    total: getAllSitemapEntries().length,
    byType: {
      posts: getPostEntries().length,
      hubs: getHubEntries().length,
      pillars: getPillarEntries().length,
      programmatic: getProgrammaticEntries().length,
      resources: getResourceEntries().length,
      authors: getAuthorEntries().length,
    },
  };
}

// Validate sitemap entry
export function validateSitemapEntry(entry: SitemapEntry): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!entry.loc) {
    errors.push('URL location is required');
  }

  if (entry.priority < 0 || entry.priority > 1) {
    errors.push('Priority must be between 0.0 and 1.0');
  }

  try {
    new Date(entry.lastmod);
  } catch {
    errors.push('Invalid lastmod date');
  }

  return { valid: errors.length === 0, errors };
}
