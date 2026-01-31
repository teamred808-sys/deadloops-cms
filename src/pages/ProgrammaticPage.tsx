import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProgrammaticPage as ProgrammaticPageType } from '@/types/seo';
import { getStorageItem, STORAGE_KEYS } from '@/lib/storage';
import { getGenreBySlug } from '@/lib/musicGenres';
import { getTemplateByType, TemplateType } from '@/lib/programmaticTemplates';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFooter from '@/components/blog/BlogFooter';
import { Link } from 'react-router-dom';

export default function ProgrammaticPage() {
  const { genre, templateType } = useParams<{ genre: string; templateType: string }>();
  const [page, setPage] = useState<ProgrammaticPageType | null>(null);

  const genreData = genre ? getGenreBySlug(genre) : null;
  const template = templateType ? getTemplateByType(templateType as TemplateType) : null;

  useEffect(() => {
    if (!genre || !templateType) return;

    const pages = getStorageItem<ProgrammaticPageType[]>(STORAGE_KEYS.PROGRAMMATIC, []);
    const found = pages.find(p => p.genreSlug === genre && p.templateId === templateType);
    setPage(found || null);
  }, [genre, templateType]);

  if (!genreData || !template) {
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

  const title = page?.title || template.titlePattern.replace('{genre}', genreData.name);
  const shouldNoIndex = page?.noIndex !== false && !page?.hasContent;

  const breadcrumbs = [
    { name: 'Home', url: '/', position: 1 },
    { name: genreData.name, url: `/genre/${genreData.slug}`, position: 2 },
    { name: template.name, url: `/genre/${genreData.slug}/${template.type}`, position: 3 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={page?.seoTitle || title}
        description={page?.metaDescription || ''}
        canonical={`/genre/${genre}/${templateType}`}
        noIndex={shouldNoIndex}
      />

      <BlogHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <article>
          <h1 className="text-3xl font-bold mb-6">{title}</h1>

          {page?.content ? (
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          ) : (
            <div className="space-y-6">
              <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                <p className="font-medium mb-2">[Content Placeholder]</p>
                <p className="text-sm">Add content for "{title}" in the admin panel</p>
                <p className="text-xs mt-2">This page is set to noIndex until content is added</p>
              </div>
            </div>
          )}

          {/* Related Links Section */}
          <section className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-4">Related Guides</h2>
            
            {/* Link to Hub */}
            {template.defaultHub && (
              <div className="mb-4">
                <Link
                  to={`/blog/${template.defaultHub}`}
                  className="text-primary hover:underline"
                >
                  Browse all {template.defaultHub.replace('-', ' ')} articles →
                </Link>
              </div>
            )}

            {/* Link to Pillar */}
            {template.defaultPillar && (
              <div className="mb-4">
                <Link
                  to={`/${template.defaultPillar}`}
                  className="text-primary hover:underline"
                >
                  Read the complete guide →
                </Link>
              </div>
            )}

            {/* Related Genres */}
            {genreData.relatedGenres.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Same guide for related genres:</p>
                <div className="flex flex-wrap gap-2">
                  {genreData.relatedGenres.slice(0, 4).map(relatedSlug => (
                    <Link
                      key={relatedSlug}
                      to={`/genre/${relatedSlug}/${templateType}`}
                      className="px-3 py-1 rounded-full bg-muted text-sm hover:bg-muted/80"
                    >
                      {relatedSlug.replace('-', ' ')}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </article>
      </main>

      <BlogFooter />
    </div>
  );
}
