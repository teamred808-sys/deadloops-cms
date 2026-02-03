import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFooterPageBySlug } from '@/lib/api';
import { FooterPage } from '@/types/blog';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFooter from '@/components/blog/BlogFooter';
import SEOHead from '@/components/seo/SEOHead';
import NotFound from './NotFound';
import { Loader2 } from 'lucide-react';

export default function FooterPageDetail() {
  const { pageSlug } = useParams<{ pageSlug: string }>();
  const [page, setPage] = useState<FooterPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      if (!pageSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const pageData = await getFooterPageBySlug(pageSlug);
        if (!pageData || pageData.status !== 'published') {
          setNotFound(true);
        } else {
          setPage(pageData);
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pageSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !page) {
    return <NotFound />;
  }

  return (
    <>
      <SEOHead
        title={page.seoTitle || page.title}
        description={page.metaDescription || `${page.title} - Read more about our policies and information.`}
        canonical={`/p/${page.slug}`}
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <BlogHeader />
        
        <main className="flex-1">
          <article className="container mx-auto px-4 py-12 max-w-4xl">
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold">{page.title}</h1>
            </header>
            
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </article>
        </main>
        
        <BlogFooter />
      </div>
    </>
  );
}
