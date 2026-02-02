import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Hub } from '@/types/seo';
import { Post, Category } from '@/types/blog';
import { getStorageItem, STORAGE_KEYS } from '@/lib/storage';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFooter from '@/components/blog/BlogFooter';
import BlogCard from '@/components/blog/BlogCard';

export default function HubPage() {
  // Can be 'slug' (from RootSlugPage) or 'hubSlug' (legacy/direct route if preserved)
  const params = useParams();
  const hubSlug = params.slug || params.hubSlug;

  const [hub, setHub] = useState<Hub | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const hubs = getStorageItem<Hub[]>(STORAGE_KEYS.HUBS, []);
    const foundHub = hubs.find(h => h.slug === hubSlug);
    setHub(foundHub || null);

    const allCategories = getStorageItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    setCategories(allCategories);

    if (foundHub) {
      const allPosts = getStorageItem<Post[]>(STORAGE_KEYS.POSTS, []);
      const hubPosts = allPosts.filter(
        p => p.status === 'published' && p.categories.some(c => c.toLowerCase().includes(foundHub.slug))
      );
      setPosts(hubPosts);
    }
  }, [hubSlug]);

  if (!hub) {
    return (
      <div className="min-h-screen flex flex-col">
        <BlogHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold">Hub not found</h1>
        </main>
        <BlogFooter />
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Blog', url: '/', position: 1 },
    { name: hub.name, url: `/blog/${hub.slug}`, position: 2 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={hub.seoTitle || hub.name}
        description={hub.metaDescription}
        canonical={`/blog/${hub.slug}`}
        noIndex={hub.noIndex}
        rssFeeds={[
          { title: `${hub.name} RSS Feed`, href: `/rss/${hub.slug}.xml` }
        ]}
      />

      <BlogHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {/* Hub Header - Empty placeholders for site owner */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {hub.name || '[Hub Title Placeholder]'}
          </h1>
          {hub.description ? (
            <p className="text-lg text-muted-foreground">{hub.description}</p>
          ) : (
            <p className="text-muted-foreground italic">[Hub description - to be added]</p>
          )}
        </header>

        {/* Posts Grid */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Articles in {hub.name}</h2>
          {posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <BlogCard key={post.id} post={post} categories={categories} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No articles yet. Content will appear here once published.</p>
          )}
        </section>
      </main>

      <BlogFooter />
    </div>
  );
}
