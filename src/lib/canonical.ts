// Canonical URL Logic and URL Normalization

import { getSettings } from './api';

// Get the base URL for canonicals
export function getCanonicalBase(): string {
  const settings = getSettings();
  // For now, use window.location.origin as fallback
  return typeof window !== 'undefined' ? window.location.origin : '';
}

// Normalize URL - lowercase, trailing slash handling, query removal
export function normalizeUrl(url: string): string {
  try {
    // Remove query strings and hash
    let normalized = url.split('?')[0].split('#')[0];
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    // Remove trailing slash (except for root)
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    // Remove double slashes (except in protocol)
    normalized = normalized.replace(/([^:])\/\/+/g, '$1/');
    
    return normalized;
  } catch {
    return url;
  }
}

// Generate canonical URL for a page
export function generateCanonical(path: string, baseUrl?: string): string {
  const base = baseUrl || getCanonicalBase();
  const normalizedPath = normalizeUrl(path);
  
  // Ensure path starts with /
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  
  return `${base}${cleanPath}`;
}

// Check if two URLs are potentially duplicates
export function areDuplicateUrls(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}

// Detect potential duplicate content issues
export function detectDuplicates(urls: string[]): { url: string; duplicateOf: string }[] {
  const duplicates: { url: string; duplicateOf: string }[] = [];
  const seen = new Map<string, string>();
  
  for (const url of urls) {
    const normalized = normalizeUrl(url);
    const existing = seen.get(normalized);
    
    if (existing && existing !== url) {
      duplicates.push({ url, duplicateOf: existing });
    } else {
      seen.set(normalized, url);
    }
  }
  
  return duplicates;
}

// Get canonical URL for different page types
export function getCanonicalForPageType(
  pageType: 'home' | 'blog' | 'hub' | 'pillar' | 'programmatic' | 'resource' | 'author',
  slug?: string,
  additionalPath?: string
): string {
  const base = getCanonicalBase();
  
  switch (pageType) {
    case 'home':
      return base;
    case 'blog':
      return generateCanonical(`/blog/${slug || ''}`);
    case 'hub':
      return generateCanonical(`/blog/${slug || ''}`);
    case 'pillar':
      return generateCanonical(`/${slug || ''}`);
    case 'programmatic':
      return generateCanonical(`/genre/${slug || ''}${additionalPath ? `/${additionalPath}` : ''}`);
    case 'resource':
      return generateCanonical(`/resources/${slug || ''}`);
    case 'author':
      return generateCanonical(`/author/${slug || ''}`);
    default:
      return base;
  }
}

// Check if URL should use www or non-www version (based on settings)
export function enforceWwwConsistency(url: string, useWww: boolean = false): string {
  try {
    const urlObj = new URL(url);
    
    if (useWww && !urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = `www.${urlObj.hostname}`;
    } else if (!useWww && urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.replace('www.', '');
    }
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Check if URL is a valid internal link
export function isValidInternalUrl(url: string, baseUrl?: string): boolean {
  const base = baseUrl || getCanonicalBase();
  
  try {
    const urlObj = new URL(url, base);
    const baseObj = new URL(base);
    
    return urlObj.hostname === baseObj.hostname;
  } catch {
    // Relative URLs are internal
    return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//');
  }
}

// Extract path from URL
export function extractPath(url: string): string {
  try {
    const urlObj = new URL(url, 'http://localhost');
    return urlObj.pathname;
  } catch {
    return url;
  }
}
