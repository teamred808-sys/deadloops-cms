// RSS Feed Page Component
// Renders XML RSS feeds for main site, categories, tags, and authors

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublishedPosts, getCategories, getSettings } from '@/lib/api';
import {
  generateMainFeed,
  generateCategoryFeed,
  generateTagFeed,
  generateAuthorFeed,
  RSSFeedOptions,
} from '@/lib/rss';
import { Post, Category, Settings } from '@/types/blog';

type FeedType = 'main' | 'category' | 'tag' | 'author';

interface RSSFeedPageProps {
  feedType?: FeedType;
}

export default function RSSFeedPage({ feedType = 'main' }: RSSFeedPageProps) {
  const { categorySlug, tagSlug, authorSlug } = useParams<{
    categorySlug?: string;
    tagSlug?: string;
    authorSlug?: string;
  }>();
  
  const [loading, setLoading] = useState(true);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateFeed() {
      try {
        const [posts, categories, settings] = await Promise.all([
          getPublishedPosts(),
          getCategories(),
          getSettings(),
        ]);

        const options: RSSFeedOptions = {
          posts,
          categories,
          settings: settings || {
            siteTitle: 'Blog',
            tagline: 'Blog Feed',
            logo: null,
            postsPerPage: 12,
            downloadTimerDuration: 10,
            adBlockerDetectionEnabled: false,
            adBlockerMessage: '',
            googleAdsEnabled: false,
            googleAdsClientId: '',
            googleAdsDisplaySlotId: '',
            googleAdsInFeedSlotId: '',
            googleAdsInArticleSlotId: '',
            googleAdsMultiplexSlotId: '',
            googleAdsCode: '',
          },
        };

        let xml: string;

        // Determine feed type from props or URL params
        if (categorySlug) {
          xml = generateCategoryFeed(categorySlug, options);
        } else if (tagSlug) {
          xml = generateTagFeed(tagSlug, options);
        } else if (authorSlug) {
          xml = generateAuthorFeed(authorSlug, options);
        } else {
          xml = generateMainFeed(options);
        }

        setXmlContent(xml);
        setLoading(false);

        // Set the content type and render raw XML
        // Note: In a React SPA, we render the XML as text
        // For production, this should be served from an actual XML endpoint
      } catch (err) {
        console.error('Error generating RSS feed:', err);
        setError('Failed to generate RSS feed');
        setLoading(false);
      }
    }

    generateFeed();
  }, [feedType, categorySlug, tagSlug, authorSlug]);

  // Set document title for clarity
  useEffect(() => {
    document.title = 'RSS Feed';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating RSS feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-2">Error</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Render the XML content
  // For a proper RSS feed, this would be served with content-type: application/rss+xml
  // In a React SPA, we display it as preformatted text with download option
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">RSS Feed</h1>
            <p className="text-muted-foreground text-sm">
              Copy the URL of this page to use in your RSS reader, or download the XML file.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Feed URL copied to clipboard!');
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Copy URL
            </button>
            <button
              onClick={() => {
                const blob = new Blob([xmlContent], { type: 'application/rss+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'feed.xml';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/90"
            >
              Download XML
            </button>
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-4 overflow-auto">
          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
            {xmlContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
