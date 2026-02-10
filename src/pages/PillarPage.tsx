import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PillarPage as PillarPageType } from '@/types/seo';
import { getStorageItem, STORAGE_KEYS } from '@/lib/storage';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import TableOfContents from '@/components/seo/TableOfContents';
import FAQSection from '@/components/seo/FAQSection';
import { ComparisonTablePlaceholder } from '@/components/seo/ComparisonTable';
import { VideoEmbedPlaceholder } from '@/components/seo/VideoEmbed';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFooter from '@/components/blog/BlogFooter';

export default function PillarPage() {
  // Can be 'slug' (from RootSlugPage) or 'pillarSlug' (legacy/direct route)
  const params = useParams();
  const pillarSlug = params.slug || params.pillarSlug;

  const [pillar, setPillar] = useState<PillarPageType | null>(null);

  useEffect(() => {
    const pillars = getStorageItem<PillarPageType[]>(STORAGE_KEYS.PILLARS, []);
    const found = pillars.find(p => p.slug === pillarSlug);
    setPillar(found || null);
  }, [pillarSlug]);

  if (!pillar) {
    return (
      <div className="min-h-screen flex flex-col">
        <BlogHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold">Page not found</h1>
        </main>
        <BlogFooter />
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/', position: 1 },
    { name: pillar.title, url: `/${pillar.slug}`, position: 2 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={pillar.seoTitle || pillar.title}
        description={pillar.metaDescription}
        canonical={`/${pillar.slug}`}
        noIndex={pillar.noIndex}
      />

      <BlogHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Main Content */}
          <article>
            <h1 className="text-4xl font-bold mb-6">
              {pillar.title || '[Pillar Title Placeholder]'}
            </h1>

            {pillar.content ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: pillar.content }}
              />
            ) : (
              <div className="space-y-8">
                <p className="text-muted-foreground italic">[Content to be added by site owner]</p>

                {/* Content placeholders */}
                <div className="p-6 border-2 border-dashed rounded-lg">
                  <h2 className="text-xl font-semibold mb-2">[Section H2 Placeholder]</h2>
                  <p className="text-muted-foreground">[Section content...]</p>
                </div>

                <ComparisonTablePlaceholder />
                <VideoEmbedPlaceholder />
              </div>
            )}

            {/* FAQ Section */}
            {pillar.faqItems && pillar.faqItems.length > 0 ? (
              <FAQSection items={pillar.faqItems} className="mt-12" />
            ) : (
              <div className="mt-12 p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                <p className="font-medium">FAQ Section</p>
                <p className="text-sm">Add FAQ items in the admin panel</p>
              </div>
            )}
          </article>

          {/* Sidebar with TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              {pillar.tocEnabled && pillar.content && (
                <TableOfContents content={pillar.content} />
              )}
            </div>
          </aside>
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}
