// Robots.txt Generator

import { SEOSettings, defaultSEOSettings } from '@/types/seo';
import { getStorageItem, STORAGE_KEYS } from './storage';
import { getCanonicalBase } from './canonical';

// Get SEO settings
function getSEOSettings(): SEOSettings {
  return getStorageItem<SEOSettings>(STORAGE_KEYS.SEO_SETTINGS, defaultSEOSettings);
}

// Default robots.txt rules
const defaultRules = {
  userAgent: '*',
  allow: ['/'],
  disallow: [
    '/admin/',
    '/admin/*',
    '/api/',
    '/*.json$',
    '/draft/',
  ],
  crawlDelay: undefined as number | undefined,
};

// Generate robots.txt content
export function generateRobotsTxt(): string {
  const settings = getSEOSettings();
  
  // If custom robots.txt content is set, use it
  if (settings.robotsTxtContent && settings.robotsTxtContent.trim()) {
    // Ensure sitemap URL is included
    const content = settings.robotsTxtContent;
    if (!content.includes('Sitemap:')) {
      const baseUrl = getCanonicalBase();
      return `${content}\n\nSitemap: ${baseUrl}/sitemap.xml`;
    }
    return content;
  }
  
  // Generate default robots.txt
  return generateDefaultRobotsTxt();
}

// Generate default robots.txt
function generateDefaultRobotsTxt(): string {
  const baseUrl = getCanonicalBase();
  
  const lines: string[] = [];
  
  // User-agent
  lines.push(`User-agent: ${defaultRules.userAgent}`);
  
  // Allow rules
  for (const path of defaultRules.allow) {
    lines.push(`Allow: ${path}`);
  }
  
  // Disallow rules
  for (const path of defaultRules.disallow) {
    lines.push(`Disallow: ${path}`);
  }
  
  // Crawl delay (if set)
  if (defaultRules.crawlDelay) {
    lines.push(`Crawl-delay: ${defaultRules.crawlDelay}`);
  }
  
  // Empty line before sitemap
  lines.push('');
  
  // Sitemap
  if (baseUrl) {
    lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
  } else {
    lines.push('Sitemap: /sitemap.xml');
  }
  
  return lines.join('\n');
}

// Get specific bot rules
export function getBotRules(botName: string): { allow: string[]; disallow: string[] } {
  // Default rules for all bots
  const rules = {
    allow: [...defaultRules.allow],
    disallow: [...defaultRules.disallow],
  };
  
  // Specific bot rules can be added here
  switch (botName.toLowerCase()) {
    case 'googlebot':
      // Google-specific rules
      break;
    case 'bingbot':
      // Bing-specific rules
      break;
    case 'gptbot':
      // Block AI crawlers if desired
      rules.disallow.push('/');
      rules.allow.length = 0;
      break;
    case 'ccbot':
      // Block Common Crawl if desired
      rules.disallow.push('/');
      rules.allow.length = 0;
      break;
    default:
      // Use default rules
      break;
  }
  
  return rules;
}

// Check if a path is allowed for crawling
export function isPathAllowed(path: string, userAgent: string = '*'): boolean {
  const rules = userAgent === '*' ? defaultRules : getBotRules(userAgent);
  
  // Check disallow rules first
  for (const disallowPattern of rules.disallow) {
    if (matchPath(path, disallowPattern)) {
      // Check if there's a more specific allow rule
      for (const allowPattern of rules.allow) {
        if (matchPath(path, allowPattern) && allowPattern.length > disallowPattern.length) {
          return true;
        }
      }
      return false;
    }
  }
  
  // Check allow rules
  for (const allowPattern of rules.allow) {
    if (matchPath(path, allowPattern)) {
      return true;
    }
  }
  
  // Default to allow
  return true;
}

// Simple path matching (supports * wildcard and $ end anchor)
function matchPath(path: string, pattern: string): boolean {
  // Handle end anchor
  const hasEndAnchor = pattern.endsWith('$');
  let regex = pattern;
  
  if (hasEndAnchor) {
    regex = regex.slice(0, -1);
  }
  
  // Escape special regex characters except *
  regex = regex.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  
  // Convert * to regex .*
  regex = regex.replace(/\*/g, '.*');
  
  // Add anchors
  regex = `^${regex}${hasEndAnchor ? '$' : ''}`;
  
  try {
    return new RegExp(regex).test(path);
  } catch {
    return false;
  }
}

// Validate robots.txt content
export function validateRobotsTxt(content: string): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const lines = content.split('\n').map(l => l.trim());
  
  let hasUserAgent = false;
  let hasSitemap = false;
  
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    
    if (line.toLowerCase().startsWith('user-agent:')) {
      hasUserAgent = true;
    } else if (line.toLowerCase().startsWith('sitemap:')) {
      hasSitemap = true;
    } else if (line.toLowerCase().startsWith('allow:') || line.toLowerCase().startsWith('disallow:')) {
      if (!hasUserAgent) {
        errors.push('Allow/Disallow rules must come after User-agent directive');
      }
    } else if (!line.toLowerCase().startsWith('crawl-delay:')) {
      warnings.push(`Unrecognized directive: ${line}`);
    }
  }
  
  if (!hasUserAgent) {
    errors.push('Missing User-agent directive');
  }
  
  if (!hasSitemap) {
    warnings.push('No Sitemap directive found');
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
