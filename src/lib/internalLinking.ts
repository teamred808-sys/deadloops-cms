// Internal Linking Automation System

import { Post } from '@/types/blog';
import { Hub, PillarPage, ProgrammaticPage, InternalLink } from '@/types/seo';
import { getStorageItem, STORAGE_KEYS } from './storage';

// Get data from storage
function getHubs(): Hub[] {
  return getStorageItem<Hub[]>(STORAGE_KEYS.HUBS, []);
}

function getPillars(): PillarPage[] {
  return getStorageItem<PillarPage[]>(STORAGE_KEYS.PILLARS, []);
}

function getPosts(): Post[] {
  return getStorageItem<Post[]>(STORAGE_KEYS.POSTS, []);
}

// Calculate relevance score between a post and a hub
function calculateHubRelevance(post: Post, hub: Hub): number {
  let score = 0;

  // Check category match (hub slug in post categories array)
  const hubSlugLower = hub.slug.toLowerCase();
  const categoriesLower = post.categories.map(c => c.toLowerCase());

  if (categoriesLower.some(cat => cat.includes(hubSlugLower) || hubSlugLower.includes(cat))) {
    score += 50;
  }

  // Check title/content keywords
  const titleLower = post.title.toLowerCase();
  const hubNameLower = hub.name.toLowerCase();

  if (titleLower.includes(hubNameLower)) {
    score += 30;
  }

  // Check tags
  const tagsLower = post.tags.map(t => t.toLowerCase());
  if (tagsLower.some(tag => hubSlugLower.includes(tag) || tag.includes(hubSlugLower))) {
    score += 20;
  }

  return score;
}

// Calculate relevance score between a post and a pillar
function calculatePillarRelevance(post: Post, pillar: PillarPage): number {
  let score = 0;

  const titleLower = post.title.toLowerCase();
  const pillarTitleLower = pillar.title.toLowerCase();

  // Title keyword matching
  const pillarKeywords = pillarTitleLower.split(/\s+/);
  const matchedKeywords = pillarKeywords.filter(keyword =>
    keyword.length > 3 && titleLower.includes(keyword)
  );

  score += matchedKeywords.length * 15;

  // Check linked hubs overlap
  if (pillar.linkedHubs.length > 0) {
    // Would need to check if post categories match pillar's linked hubs
    score += 10;
  }

  return score;
}

// Get the most relevant pillar for a post
export function getRelevantPillar(post: Post): { pillar: PillarPage; score: number } | null {
  const pillars = getPillars();
  if (pillars.length === 0) return null;

  let bestMatch: { pillar: PillarPage; score: number } | null = null;

  for (const pillar of pillars) {
    const score = calculatePillarRelevance(post, pillar);
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { pillar, score };
    }
  }

  return bestMatch;
}

// Get the most relevant hub for a post
export function getRelevantHub(post: Post): { hub: Hub; score: number } | null {
  const hubs = getHubs();
  if (hubs.length === 0) return null;

  let bestMatch: { hub: Hub; score: number } | null = null;

  for (const hub of hubs) {
    const score = calculateHubRelevance(post, hub);
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { hub, score };
    }
  }

  return bestMatch;
}

// Get related posts based on categories and tags
export function getRelatedPosts(post: Post, count: number = 3): Post[] {
  const posts = getPosts().filter(p =>
    p.id !== post.id &&
    p.status === 'published'
  );

  const scored = posts.map(p => {
    let score = 0;

    // Category overlap
    const categoryOverlap = post.categories.filter(c => p.categories.includes(c)).length;
    score += categoryOverlap * 30;

    // Tag overlap
    const tagOverlap = post.tags.filter(t => p.tags.includes(t)).length;
    score += tagOverlap * 20;

    return { post: p, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => s.post);
}

// Generate context-aware anchor text
export function generateAnchorText(keyword: string, targetTitle: string): string {
  // Avoid generic anchors like "click here" or "read more"
  // Use the keyword if provided, otherwise use a portion of the target title

  if (keyword && keyword.length > 2) {
    return keyword;
  }

  // Extract a meaningful phrase from the title
  const words = targetTitle.split(/\s+/);
  if (words.length <= 4) {
    return targetTitle;
  }

  // Take first 3-4 meaningful words
  return words.slice(0, 4).join(' ');
}

// Get all suggested internal links for a post
export function getSuggestedLinks(post: Post): InternalLink[] {
  const links: InternalLink[] = [];

  // Get relevant pillar link
  const pillarMatch = getRelevantPillar(post);
  if (pillarMatch) {
    links.push({
      targetUrl: `/${pillarMatch.pillar.slug}`,
      anchorText: generateAnchorText('', pillarMatch.pillar.title),
      relevanceScore: pillarMatch.score,
      linkType: 'pillar',
    });
  }

  // Get relevant hub link
  const hubMatch = getRelevantHub(post);
  if (hubMatch) {
    links.push({
      targetUrl: `/${hubMatch.hub.slug}`,
      anchorText: generateAnchorText('', hubMatch.hub.name),
      relevanceScore: hubMatch.score,
      linkType: 'hub',
    });
  }

  // Get related post links
  const relatedPosts = getRelatedPosts(post, 2);
  for (const related of relatedPosts) {
    links.push({
      targetUrl: `/${related.slug}`,
      anchorText: generateAnchorText('', related.title),
      relevanceScore: 50,
      linkType: 'related',
    });
  }

  return links;
}

// Validate internal links in content
export function validateInternalLinks(content: string, allUrls: string[]): { url: string; valid: boolean }[] {
  const results: { url: string; valid: boolean }[] = [];

  // Extract all internal links from content
  const linkRegex = /href=["']([^"']+)["']/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[1];

    // Only check internal links
    if (url.startsWith('/') && !url.startsWith('//')) {
      const isValid = allUrls.includes(url) || allUrls.includes(url.replace(/\/$/, ''));
      results.push({ url, valid: isValid });
    }
  }

  return results;
}

// Get broken internal links
export function getBrokenLinks(content: string, validUrls: string[]): string[] {
  const validation = validateInternalLinks(content, validUrls);
  return validation.filter(v => !v.valid).map(v => v.url);
}

// Check internal link coverage for a post
export function checkLinkCoverage(post: Post): {
  hasPillarLink: boolean;
  hasHubLink: boolean;
  hasRelatedLinks: boolean;
  suggestedLinks: InternalLink[];
} {
  const suggested = getSuggestedLinks(post);
  const content = post.content.toLowerCase();

  return {
    hasPillarLink: suggested.some(l => l.linkType === 'pillar' && content.includes(l.targetUrl)),
    hasHubLink: suggested.some(l => l.linkType === 'hub' && content.includes(l.targetUrl)),
    hasRelatedLinks: suggested.filter(l => l.linkType === 'related' && content.includes(l.targetUrl)).length >= 1,
    suggestedLinks: suggested,
  };
}

// Get all internal URLs for the site (for validation)
export function getAllInternalUrls(): string[] {
  const urls: string[] = ['/'];

  // Add hub URLs
  const hubs = getHubs();
  for (const hub of hubs) {
    urls.push(`/${hub.slug}`);
  }

  // Add pillar URLs
  const pillars = getPillars();
  for (const pillar of pillars) {
    urls.push(`/${pillar.slug}`);
  }

  // Add post URLs
  const posts = getPosts();
  for (const post of posts) {
    if (post.status === 'published') {
      urls.push(`/${post.slug}`);
    }
  }

  return urls;
}
