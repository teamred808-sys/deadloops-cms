// noIndex Logic and Content Quality Control

import { Post } from '@/types/blog';
import { PillarPage, ProgrammaticPage, Hub, ResourcePage, SEOSettings, defaultSEOSettings } from '@/types/seo';
import { getStorageItem, STORAGE_KEYS } from './storage';

// Get SEO settings
function getSEOSettings(): SEOSettings {
  return getStorageItem<SEOSettings>(STORAGE_KEYS.SEO_SETTINGS, defaultSEOSettings);
}

// Strip HTML tags and get plain text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Get word count from content
export function getWordCount(content: string): number {
  const plainText = stripHtml(content);
  if (!plainText) return 0;
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

// Check if content is considered "thin"
export function isThinContent(content: string, minLength?: number): boolean {
  const settings = getSEOSettings();
  const threshold = minLength ?? settings.minContentLength;
  return getWordCount(content) < threshold;
}

// Check if content is empty
export function isEmptyContent(content: string): boolean {
  const plainText = stripHtml(content);
  return plainText.length === 0;
}

// Determine if a blog post should be noIndexed
export function shouldNoIndexPost(post: Post): boolean {
  const settings = getSEOSettings();
  
  // Draft posts should never be indexed
  if (post.status === 'draft') return true;
  
  // Check if auto noIndex is enabled for empty content
  if (settings.autoNoIndexEmpty && isEmptyContent(post.content)) return true;
  
  // Check if content is thin
  if (isThinContent(post.content)) return true;
  
  return false;
}

// Determine if a pillar page should be noIndexed
export function shouldNoIndexPillar(pillar: PillarPage): boolean {
  const settings = getSEOSettings();
  
  // Explicitly set noIndex
  if (pillar.noIndex) return true;
  
  // Check if auto noIndex is enabled for empty content
  if (settings.autoNoIndexEmpty && isEmptyContent(pillar.content)) return true;
  
  // Pillar pages should have more content than regular posts
  if (isThinContent(pillar.content, settings.minContentLength * 2)) return true;
  
  return false;
}

// Determine if a programmatic page should be noIndexed
export function shouldNoIndexProgrammatic(page: ProgrammaticPage): boolean {
  const settings = getSEOSettings();
  
  // Explicitly set noIndex
  if (page.noIndex) return true;
  
  // Has no content flag
  if (!page.hasContent) return true;
  
  // Check if auto noIndex is enabled for empty content
  if (settings.autoNoIndexEmpty && isEmptyContent(page.content)) return true;
  
  // Check if content is thin
  if (isThinContent(page.content)) return true;
  
  return false;
}

// Determine if a hub should be noIndexed
export function shouldNoIndexHub(hub: Hub): boolean {
  const settings = getSEOSettings();
  
  // Explicitly set noIndex
  if (hub.noIndex) return true;
  
  // Hubs with no description should be noIndexed if auto setting is on
  if (settings.autoNoIndexEmpty && isEmptyContent(hub.description)) return true;
  
  return false;
}

// Determine if a resource page should be noIndexed
export function shouldNoIndexResource(resource: ResourcePage): boolean {
  const settings = getSEOSettings();
  
  // Explicitly set noIndex
  if (resource.noIndex) return true;
  
  // Resources without download URL or description
  if (settings.autoNoIndexEmpty && (!resource.downloadUrl || isEmptyContent(resource.description))) return true;
  
  return false;
}

// Get content quality score (0-100)
export function getContentQualityScore(content: string): number {
  const settings = getSEOSettings();
  const wordCount = getWordCount(content);
  const minLength = settings.minContentLength;
  
  if (wordCount === 0) return 0;
  if (wordCount < minLength / 2) return 25;
  if (wordCount < minLength) return 50;
  if (wordCount < minLength * 2) return 75;
  return 100;
}

// SEO readiness check for a page
export interface SEOReadinessResult {
  isReady: boolean;
  score: number;
  issues: string[];
  warnings: string[];
}

export function checkSEOReadiness(
  title: string,
  seoTitle: string,
  metaDescription: string,
  content: string
): SEOReadinessResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  
  // Title checks
  if (!title) {
    issues.push('Title is missing');
    score -= 20;
  }
  
  // SEO title checks
  if (!seoTitle) {
    warnings.push('SEO title is not set (will use page title)');
    score -= 5;
  } else if (seoTitle.length > 60) {
    warnings.push('SEO title is too long (over 60 characters)');
    score -= 5;
  } else if (seoTitle.length < 30) {
    warnings.push('SEO title is too short (under 30 characters)');
    score -= 5;
  }
  
  // Meta description checks
  if (!metaDescription) {
    issues.push('Meta description is missing');
    score -= 15;
  } else if (metaDescription.length > 160) {
    warnings.push('Meta description is too long (over 160 characters)');
    score -= 5;
  } else if (metaDescription.length < 70) {
    warnings.push('Meta description is too short (under 70 characters)');
    score -= 5;
  }
  
  // Content checks
  if (isEmptyContent(content)) {
    issues.push('Content is empty');
    score -= 30;
  } else if (isThinContent(content)) {
    warnings.push('Content is thin (below minimum word count)');
    score -= 10;
  }
  
  return {
    isReady: issues.length === 0 && score >= 70,
    score: Math.max(0, score),
    issues,
    warnings,
  };
}

// Bulk check for pages that should be indexed
export function getIndexablePages<T extends { noIndex?: boolean; content?: string }>(
  pages: T[],
  contentKey: keyof T = 'content' as keyof T
): T[] {
  return pages.filter(page => {
    if (page.noIndex) return false;
    const content = page[contentKey];
    if (typeof content === 'string' && isEmptyContent(content)) return false;
    return true;
  });
}
