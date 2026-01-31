// RSS 2.0 Feed Generator
// Generates valid RSS 2.0 XML feeds for blog content

import { Post, Category, Settings } from '@/types/blog';
import { shouldNoIndexPost } from './indexControl';

// RSS 2.0 Namespaces
const RSS_NAMESPACES = {
  content: 'http://purl.org/rss/1.0/modules/content/',
  dc: 'http://purl.org/dc/elements/1.1/',
  media: 'http://search.yahoo.com/mrss/',
  atom: 'http://www.w3.org/2005/Atom',
};

// Escape XML special characters
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Format date to RFC 822 (required for RSS)
export function formatRFC822Date(dateString: string): string {
  const date = new Date(dateString);
  return date.toUTCString();
}

// Get the base URL for the site
export function getSiteUrl(): string {
  return window.location.origin;
}

// Get eligible posts for RSS feed (published, indexable, quality content)
export function getEligiblePosts(posts: Post[]): Post[] {
  return posts
    .filter(post => 
      post.status === 'published' && 
      !post.noIndex && 
      !shouldNoIndexPost(post)
    )
    .sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
}

// Filter posts by category
export function filterPostsByCategory(posts: Post[], categorySlug: string, categories: Category[]): Post[] {
  const category = categories.find(c => c.slug === categorySlug);
  if (!category) return [];
  
  return posts.filter(post => 
    post.categories.some(catId => {
      const cat = categories.find(c => c.id === catId);
      return cat?.slug === categorySlug || cat?.id === category.id;
    })
  );
}

// Filter posts by tag
export function filterPostsByTag(posts: Post[], tagSlug: string): Post[] {
  return posts.filter(post => 
    post.tags.some(tag => 
      tag.toLowerCase().replace(/\s+/g, '-') === tagSlug
    )
  );
}

// Filter posts by author
export function filterPostsByAuthor(posts: Post[], authorSlug: string): Post[] {
  return posts.filter(post => {
    const authorNameSlug = post.author.toLowerCase().replace(/\s+/g, '-');
    return authorNameSlug === authorSlug || post.authorId === authorSlug;
  });
}

// Generate RSS item for a post
function generateRSSItem(post: Post, categories: Category[], siteUrl: string): string {
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const pubDate = formatRFC822Date(post.publishDate);
  
  // Get category names
  const categoryNames = post.categories
    .map(catId => categories.find(c => c.id === catId)?.name)
    .filter(Boolean);
  
  // Build category tags
  const categoryTags = categoryNames
    .map(name => `    <category>${escapeXml(name as string)}</category>`)
    .join('\n');
  
  // Build media tags for featured image
  let mediaTags = '';
  if (post.featuredImage) {
    const imageUrl = post.featuredImage.startsWith('http') 
      ? post.featuredImage 
      : `${siteUrl}${post.featuredImage}`;
    mediaTags = `
    <media:content url="${escapeXml(imageUrl)}" medium="image" />
    <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0" />`;
  }
  
  return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(postUrl)}</link>
    <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(post.excerpt || post.metaDescription || '')}</description>
    <content:encoded><![CDATA[${post.content}]]></content:encoded>
    <dc:creator>${escapeXml(post.author)}</dc:creator>
${categoryTags}${mediaTags}
  </item>`;
}

// Generate RSS channel header
function generateRSSHeader(
  title: string,
  description: string,
  feedUrl: string,
  siteUrl: string,
  lastBuildDate: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="${RSS_NAMESPACES.content}"
     xmlns:dc="${RSS_NAMESPACES.dc}"
     xmlns:media="${RSS_NAMESPACES.media}"
     xmlns:atom="${RSS_NAMESPACES.atom}">
<channel>
  <title>${escapeXml(title)}</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>${escapeXml(description)}</description>
  <language>en-us</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
  <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
`;
}

// Generate RSS channel footer
function generateRSSFooter(): string {
  return `</channel>
</rss>`;
}

// Interface for feed generation options
export interface RSSFeedOptions {
  posts: Post[];
  categories: Category[];
  settings: Settings;
  feedTitle?: string;
  feedDescription?: string;
  feedPath?: string;
}

// Generate main RSS feed (all posts)
export function generateMainFeed(options: RSSFeedOptions): string {
  const { posts, categories, settings, feedPath = '/rss.xml' } = options;
  const siteUrl = getSiteUrl();
  const feedUrl = `${siteUrl}${feedPath}`;
  
  const eligiblePosts = getEligiblePosts(posts);
  const lastBuildDate = eligiblePosts.length > 0 
    ? formatRFC822Date(eligiblePosts[0].publishDate)
    : formatRFC822Date(new Date().toISOString());
  
  const title = options.feedTitle || settings.siteTitle || 'Blog';
  const description = options.feedDescription || settings.tagline || 'Blog Feed';
  
  const header = generateRSSHeader(title, description, feedUrl, siteUrl, lastBuildDate);
  const items = eligiblePosts.map(post => generateRSSItem(post, categories, siteUrl)).join('\n');
  const footer = generateRSSFooter();
  
  return header + items + '\n' + footer;
}

// Generate category-specific RSS feed
export function generateCategoryFeed(
  categorySlug: string,
  options: RSSFeedOptions
): string {
  const { posts, categories, settings } = options;
  const siteUrl = getSiteUrl();
  const feedPath = `/rss/${categorySlug}.xml`;
  const feedUrl = `${siteUrl}${feedPath}`;
  
  // Find category
  const category = categories.find(c => c.slug === categorySlug);
  if (!category) {
    return generateEmptyFeed(`Category: ${categorySlug}`, feedUrl, siteUrl);
  }
  
  // Filter and get eligible posts
  const categoryPosts = filterPostsByCategory(posts, categorySlug, categories);
  const eligiblePosts = getEligiblePosts(categoryPosts);
  
  const lastBuildDate = eligiblePosts.length > 0 
    ? formatRFC822Date(eligiblePosts[0].publishDate)
    : formatRFC822Date(new Date().toISOString());
  
  const title = `${category.name} - ${settings.siteTitle}`;
  const description = category.description || `${category.name} articles from ${settings.siteTitle}`;
  
  const header = generateRSSHeader(title, description, feedUrl, siteUrl, lastBuildDate);
  const items = eligiblePosts.map(post => generateRSSItem(post, categories, siteUrl)).join('\n');
  const footer = generateRSSFooter();
  
  return header + items + '\n' + footer;
}

// Generate tag-specific RSS feed
export function generateTagFeed(
  tagSlug: string,
  options: RSSFeedOptions
): string {
  const { posts, categories, settings } = options;
  const siteUrl = getSiteUrl();
  const feedPath = `/rss/tag/${tagSlug}.xml`;
  const feedUrl = `${siteUrl}${feedPath}`;
  
  // Filter and get eligible posts
  const tagPosts = filterPostsByTag(posts, tagSlug);
  const eligiblePosts = getEligiblePosts(tagPosts);
  
  const lastBuildDate = eligiblePosts.length > 0 
    ? formatRFC822Date(eligiblePosts[0].publishDate)
    : formatRFC822Date(new Date().toISOString());
  
  const tagName = tagSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const title = `${tagName} - ${settings.siteTitle}`;
  const description = `Articles tagged with ${tagName} from ${settings.siteTitle}`;
  
  const header = generateRSSHeader(title, description, feedUrl, siteUrl, lastBuildDate);
  const items = eligiblePosts.map(post => generateRSSItem(post, categories, siteUrl)).join('\n');
  const footer = generateRSSFooter();
  
  return header + items + '\n' + footer;
}

// Generate author-specific RSS feed
export function generateAuthorFeed(
  authorSlug: string,
  options: RSSFeedOptions
): string {
  const { posts, categories, settings } = options;
  const siteUrl = getSiteUrl();
  const feedPath = `/rss/author/${authorSlug}.xml`;
  const feedUrl = `${siteUrl}${feedPath}`;
  
  // Filter and get eligible posts
  const authorPosts = filterPostsByAuthor(posts, authorSlug);
  const eligiblePosts = getEligiblePosts(authorPosts);
  
  const lastBuildDate = eligiblePosts.length > 0 
    ? formatRFC822Date(eligiblePosts[0].publishDate)
    : formatRFC822Date(new Date().toISOString());
  
  const authorName = authorSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const title = `Articles by ${authorName} - ${settings.siteTitle}`;
  const description = `Articles written by ${authorName}`;
  
  const header = generateRSSHeader(title, description, feedUrl, siteUrl, lastBuildDate);
  const items = eligiblePosts.map(post => generateRSSItem(post, categories, siteUrl)).join('\n');
  const footer = generateRSSFooter();
  
  return header + items + '\n' + footer;
}

// Generate empty feed (for categories/tags with no posts)
function generateEmptyFeed(title: string, feedUrl: string, siteUrl: string): string {
  const lastBuildDate = formatRFC822Date(new Date().toISOString());
  const header = generateRSSHeader(title, 'No content available', feedUrl, siteUrl, lastBuildDate);
  const footer = generateRSSFooter();
  return header + footer;
}

// Get all available category feeds
export function getAvailableCategoryFeeds(categories: Category[]): Array<{ title: string; href: string }> {
  return categories.map(category => ({
    title: `${category.name} RSS Feed`,
    href: `/rss/${category.slug}.xml`,
  }));
}
