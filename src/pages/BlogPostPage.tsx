import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPostBySlug, getPublishedPosts, getCategories, getSettings, incrementDownloadCount, getAuthor } from '@/lib/api';
import { getUploadUrl } from '@/lib/apiClient';
import { Author } from '@/types/seo';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFooter from '@/components/blog/BlogFooter';
import BlogCard from '@/components/blog/BlogCard';
import DownloadModal from '@/components/blog/DownloadModal';
import AdBlockerPopup from '@/components/blog/AdBlockerPopup';
import GoogleAd from '@/components/blog/GoogleAd';
import SEOHead from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/storage';
import { useAdBlocker } from '@/hooks/useAdBlocker';
import { Post, Category, Settings } from '@/types/blog';
import {
  Calendar,
  User,
  Download,
  Printer,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Check,
  ArrowLeft,
  FileDown,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const { isBlocked } = useAdBlocker(settings?.adBlockerDetectionEnabled ?? false);

  useEffect(() => {
    if (!slug) return;

    Promise.all([
      getPostBySlug(slug),
      getCategories(),
      getPublishedPosts(),
      getSettings()
    ]).then(async ([postData, categoriesData, postsData, settingsData]) => {
      setPost(postData);
      setCategories(categoriesData);
      setAllPosts(postsData);
      setSettings(settingsData);

      // Fetch author if post has authorId
      if (postData?.authorId) {
        const authorData = await getAuthor(postData.authorId);
        setAuthor(authorData);
      }

      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <BlogHeader />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <BlogFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <BlogHeader />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The post you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </main>
        <BlogFooter />
      </div>
    );
  }

  const postCategories = categories.filter(cat => post.categories.includes(cat.id));

  // Related posts (same category, excluding current)
  const relatedPosts = allPosts
    .filter(p => p.id !== post.id && p.categories.some(cat => post.categories.includes(cat)))
    .slice(0, 3);

  const handleDownloadClick = () => {
    if (isBlocked) {
      toast({
        title: 'Ad Blocker Detected',
        description: 'Please disable your ad blocker to download files.',
        variant: 'destructive',
      });
      return;
    }
    setShowDownloadModal(true);
  };

  const handleDownloadComplete = () => {
    incrementDownloadCount(post.id);
    setShowDownloadModal(false);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = post.title;

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: 'Link copied!', description: 'Post link has been copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const featuredImage = post.featuredImage ? getUploadUrl(post.featuredImage) : null;

  const isPublishedAndIndexable = post.status === 'published' && !post.noIndex;

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      {/* SEO Head with Google Discover eligibility */}
      <SEOHead
        title={post.title}
        description={post.metaDescription || post.excerpt}
        canonical={`${window.location.origin}/${post.slug}`}
        noIndex={post.noIndex || post.status !== 'published'}
        ogImage={featuredImage}
        ogType="article"
        article={{
          publishedTime: post.publishDate,
          modifiedTime: post.updatedAt,
          author: post.author,
        }}
        enableDiscoverDirectives={isPublishedAndIndexable}
      />

      <BlogHeader />

      {/* Ad Blocker Popup */}
      {settings?.adBlockerDetectionEnabled && <AdBlockerPopup />}

      <main className="flex-1">
        {/* Hero Image */}
        {featuredImage && (
          <div
            className="w-full bg-muted overflow-hidden"
            style={{ aspectRatio: '16 / 9', maxHeight: '400px' }}
          >
            <img
              src={featuredImage}
              alt={post.title}
              width={1200}
              height={675}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          <article className="max-w-3xl mx-auto">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {/* Categories */}
            {postCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {postCategories.map((category) => (
                  <Badge key={category.id}>{category.name}</Badge>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
              <Link
                to={`/author/${author?.slug || 'admin'}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <User className="h-4 w-4" />
                {author?.name || post.author}
              </Link>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishDate)}
              </span>
              {post.downloadEnabled && (
                <span className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {post.downloadCount} downloads
                </span>
              )}
            </div>

            {/* Content */}
            <div
              className="prose prose-lg dark:prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* In-Article Ad */}
            {settings?.googleAdsEnabled && settings?.googleAdsInArticleSlotId && (
              <GoogleAd
                enabled={settings.googleAdsEnabled}
                clientId={settings.googleAdsClientId}
                slotId={settings.googleAdsInArticleSlotId}
                adType="in-article"
                className="mb-8"
              />
            )}

            {/* Download Section */}
            {post.downloadEnabled && post.downloadUrl && (
              <div className="bg-gradient-to-r from-primary/20 to-accent/10 border border-primary/30 rounded-xl p-6 mb-8 glow-primary">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileDown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{post.downloadFilename || 'Download File'}</p>
                      {post.downloadSize && (
                        <p className="text-sm text-muted-foreground">Size: {post.downloadSize}</p>
                      )}
                    </div>
                  </div>
                  <Button size="lg" onClick={handleDownloadClick}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {/* Share & Actions */}
            <div className="flex flex-wrap items-center gap-2 pb-8 border-b">
              <span className="text-sm text-muted-foreground mr-2">Share:</span>
              <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}>
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}>
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}>
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="max-w-5xl mx-auto mt-12 content-visibility-auto">
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost.id} post={relatedPost} categories={categories} />
                ))}
              </div>
            </div>
          )}

          {/* Multiplex Ad */}
          {settings?.googleAdsEnabled && settings?.googleAdsMultiplexSlotId && (
            <div className="max-w-5xl mx-auto mt-12">
              <GoogleAd
                enabled={settings.googleAdsEnabled}
                clientId={settings.googleAdsClientId}
                slotId={settings.googleAdsMultiplexSlotId}
                adType="multiplex"
              />
            </div>
          )}
        </div>
      </main>

      <BlogFooter />

      {/* Download Modal */}
      <DownloadModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        downloadUrl={post.downloadUrl || ''}
        filename={post.downloadFilename || 'file'}
        timerDuration={settings?.downloadTimerDuration || 15}
        onComplete={handleDownloadComplete}
        adSettings={{
          enabled: settings?.googleAdsEnabled || false,
          clientId: settings?.googleAdsClientId || '',
          slotId: settings?.googleAdsDisplaySlotId || '',
          customCode: settings?.googleAdsCode || '',
        }}
      />
    </div>
  );
}
