import { useState, useMemo, useDeferredValue, Fragment, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getPublishedPosts, getCategories, getSettings } from '@/lib/api';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFooter from '@/components/blog/BlogFooter';
import BlogCard from '@/components/blog/BlogCard';
import GoogleAd from '@/components/blog/GoogleAd';
import PaginationNav from '@/components/blog/PaginationNav';
import BlogSidebar from '@/components/blog/BlogSidebar';
import SEOHead from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import { Post, Category, Settings } from '@/types/blog';

const POSTS_PER_PAGE = 10;

export default function HomePage() {
  const { pageNumber } = useParams();
  const currentPage = pageNumber ? parseInt(pageNumber, 10) : 1;

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Deferred search for INP optimization
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    Promise.all([
      getPublishedPosts(),
      getCategories(),
      getSettings()
    ]).then(([postsData, categoriesData, settingsData]) => {
      setPosts(postsData);
      setCategories(categoriesData);
      setSettings(settingsData);
      setLoading(false);
    });
  }, []);

  // Validate page number - redirect invalid pages
  if (pageNumber && (isNaN(currentPage) || currentPage < 1)) {
    return <Navigate to="/" replace />;
  }

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(deferredSearch.toLowerCase());
      const matchesCategory = !selectedCategory || post.categories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [posts, deferredSearch, selectedCategory]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  // Redirect if page exceeds total (but only after loading is complete and we have posts)
  if (!loading && currentPage > totalPages && totalPages > 0 && !search && !selectedCategory) {
    return <Navigate to="/" replace />;
  }

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    // When filtering, we don't redirect - pagination applies to filtered results
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  // SEO: Dynamic title and canonical
  const pageTitle = currentPage === 1
    ? (settings?.siteTitle || 'Latest Music Production Articles')
    : `${settings?.siteTitle || 'Latest Music Production Articles'} - Page ${currentPage}`;

  const canonical = currentPage === 1 ? '/' : `/page/${currentPage}`;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col gradient-bg overflow-x-hidden">
        <BlogHeader />
        <main className="flex-1 container mx-auto px-3 md:px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <BlogFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-bg overflow-x-hidden">
      <SEOHead
        title={pageTitle}
        description={settings?.tagline || 'Music Production Resources & Tutorials'}
        canonical={canonical}
        rssFeeds={[
          { title: `${settings?.siteTitle || 'Deadloops'} RSS Feed`, href: '/rss.xml' }
        ]}
      />
      <BlogHeader />

      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Hero Section - Only on page 1 */}
        {currentPage === 1 && (
          <div className="text-center mb-6 md:mb-12">
            <p className="text-base md:text-xl text-muted-foreground mb-4 md:mb-8">{settings?.tagline || 'Music Production Resources & Tutorials'}</p>
          </div>
        )}

        {/* Page indicator for page 2+ */}
        {currentPage > 1 && (
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-gradient">
              Page {currentPage}
            </h1>
          </div>
        )}
        {/* Mobile Categories - Above Search */}
        <div className="lg:hidden mb-4">
          <div className="gradient-card border border-border/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === null ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleCategoryClick(null)}
              >
                All
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>


        {/* Search - Sticky on mobile */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 md:static md:py-0 mb-4 md:mb-8">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              className="pl-10 h-12"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {paginatedPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-2xl mb-2">📭</p>
                <p className="text-muted-foreground">
                  {search || selectedCategory
                    ? 'No posts found matching your criteria'
                    : 'No posts yet. Check back soon!'}
                </p>
              </div>
            ) : (
              <>
                {/* Posts Grid with In-Feed Ads */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-6">
                  {paginatedPosts.map((post, index) => (
                    <Fragment key={post.id}>
                      <BlogCard post={post} categories={categories} priority={index === 0 && currentPage === 1} />
                      {/* Insert in-feed ad after every 4 posts */}
                      {settings?.googleAdsEnabled &&
                        settings?.googleAdsInFeedSlotId &&
                        (index + 1) % 4 === 0 &&
                        index < paginatedPosts.length - 1 && (
                          <div className="sm:col-span-2">
                            <GoogleAd
                              enabled={settings.googleAdsEnabled}
                              clientId={settings.googleAdsClientId}
                              slotId={settings.googleAdsInFeedSlotId}
                              adType="in-feed"
                            />
                          </div>
                        )}
                    </Fragment>
                  ))}
                </div>

                {/* Pagination - Only show when not searching/filtering */}
                {!search && !selectedCategory && (
                  <PaginationNav
                    currentPage={currentPage}
                    totalPages={totalPages}
                    baseUrl="/"
                  />
                )}

                {/* Show simple pagination info when filtering */}
                {(search || selectedCategory) && totalPages > 1 && (
                  <div className="text-center mt-8 text-sm text-muted-foreground">
                    Showing {paginatedPosts.length} of {filteredPosts.length} filtered results
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <BlogSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
            stats={{
              totalPosts: posts.length,
              categoriesCount: categories.length
            }}
            className="lg:col-span-1"
          />
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}
