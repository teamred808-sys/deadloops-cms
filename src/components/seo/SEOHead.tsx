import { useEffect } from 'react';
import { SEOPageData } from '@/types/seo';

interface RSSFeed {
  title: string;
  href: string;
}

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string | null;
  noIndex?: boolean;
  noFollow?: boolean;
  ogImage?: string | null;
  ogType?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  jsonLd?: object | object[];
  enableDiscoverDirectives?: boolean; // Enables max-image-preview:large for Google Discover
  rssFeeds?: RSSFeed[]; // RSS auto-discovery links
}

export default function SEOHead({
  title,
  description,
  canonical,
  noIndex = false,
  noFollow = false,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  article,
  jsonLd,
  enableDiscoverDirectives = false,
  rssFeeds,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper to remove meta tag
    const removeMeta = (name: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      const meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (meta) meta.remove();
    };

    // Meta description
    if (description) {
      setMeta('description', description);
    }

    // Robots - build directive list
    const robotsContent: string[] = [];
    
    // Base index/noindex directive
    if (noIndex) {
      robotsContent.push('noindex');
    } else {
      robotsContent.push('index');
    }
    
    // Base follow/nofollow directive
    if (noFollow) {
      robotsContent.push('nofollow');
    } else {
      robotsContent.push('follow');
    }
    
    // Add Google Discover directive for eligible blog posts
    // Only when indexable AND enableDiscoverDirectives is true
    if (enableDiscoverDirectives && !noIndex) {
      robotsContent.push('max-image-preview:large');
    }
    
    setMeta('robots', robotsContent.join(', '));

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    } else if (canonicalLink) {
      canonicalLink.remove();
    }

    // Open Graph tags
    setMeta('og:title', title, true);
    setMeta('og:type', ogType, true);
    if (description) setMeta('og:description', description, true);
    if (ogImage) setMeta('og:image', ogImage, true);
    if (canonical) setMeta('og:url', canonical, true);

    // Twitter Card tags
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', title);
    if (description) setMeta('twitter:description', description);
    if (ogImage) setMeta('twitter:image', ogImage);

    // Article-specific meta tags
    if (article) {
      if (article.publishedTime) {
        setMeta('article:published_time', article.publishedTime, true);
      }
      if (article.modifiedTime) {
        setMeta('article:modified_time', article.modifiedTime, true);
      }
      if (article.author) {
        setMeta('article:author', article.author, true);
      }
      if (article.section) {
        setMeta('article:section', article.section, true);
      }
    }

    // JSON-LD Structured Data
    const existingJsonLd = document.querySelector('script[type="application/ld+json"][data-seo-head]');
    if (existingJsonLd) existingJsonLd.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-head', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    // RSS Auto-Discovery Links
    // First remove any existing RSS links we may have added
    document.querySelectorAll('link[rel="alternate"][type="application/rss+xml"][data-seo-head]').forEach(el => el.remove());
    
    if (rssFeeds && rssFeeds.length > 0) {
      rssFeeds.forEach(feed => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('type', 'application/rss+xml');
        link.setAttribute('title', feed.title);
        link.setAttribute('href', feed.href);
        link.setAttribute('data-seo-head', 'true');
        document.head.appendChild(link);
      });
    }

    // Cleanup on unmount
    return () => {
      // We don't remove tags on unmount to prevent flicker during navigation
      // They will be updated by the next page's SEOHead
    };
  }, [title, description, canonical, noIndex, noFollow, ogImage, ogType, twitterCard, article, jsonLd, enableDiscoverDirectives, rssFeeds]);

  return null; // This component doesn't render anything
}

// Helper function to create SEO page data
export function createSEOPageData(
  title: string,
  options: Partial<SEOPageData> = {}
): SEOPageData {
  return {
    title,
    description: options.description || '',
    canonical: options.canonical || null,
    noIndex: options.noIndex || false,
    noFollow: options.noFollow || false,
    ogImage: options.ogImage || null,
    ogType: options.ogType || 'website',
    twitterCard: options.twitterCard || 'summary_large_image',
    schema: options.schema || [],
    focusKeyword: options.focusKeyword || '',
    keywords: options.keywords || [],
  };
}
