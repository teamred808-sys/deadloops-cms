import { Link } from 'react-router-dom';
import { Post } from '@/types/blog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface RelatedContentProps {
  posts: Post[];
  className?: string;
  title?: string;
  count?: number;
  showImage?: boolean;
  showExcerpt?: boolean;
}

export default function RelatedContent({
  posts,
  className,
  title = 'Related Articles',
  count = 3,
  showImage = true,
  showExcerpt = false,
}: RelatedContentProps) {
  const displayPosts = posts.slice(0, count);

  if (displayPosts.length === 0) {
    return null;
  }

  return (
    <section className={cn('', className)}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayPosts.map((post) => (
          <Card key={post.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
            <Link to={`/blog/${post.slug}`}>
              {showImage && post.featuredImage && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <CardHeader className="pb-2">
                <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
              </CardHeader>
              
              {showExcerpt && post.excerpt && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                </CardContent>
              )}
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

// Simple list variant for sidebar
export function RelatedContentList({
  posts,
  className,
  title = 'Related Articles',
  count = 5,
}: {
  posts: Post[];
  className?: string;
  title?: string;
  count?: number;
}) {
  const displayPosts = posts.slice(0, count);

  if (displayPosts.length === 0) {
    return null;
  }

  return (
    <section className={cn('', className)}>
      <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      
      <ul className="space-y-2">
        {displayPosts.map((post) => (
          <li key={post.id}>
            <Link
              to={`/blog/${post.slug}`}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
            >
              <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              <span className="line-clamp-2">{post.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Compact inline related links
export function RelatedContentInline({
  posts,
  className,
  prefix = 'Related:',
  count = 3,
}: {
  posts: Post[];
  className?: string;
  prefix?: string;
  count?: number;
}) {
  const displayPosts = posts.slice(0, count);

  if (displayPosts.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-sm', className)}>
      <span className="text-muted-foreground">{prefix}</span>
      {displayPosts.map((post, index) => (
        <span key={post.id}>
          <Link
            to={`/blog/${post.slug}`}
            className="text-primary hover:underline"
          >
            {post.title}
          </Link>
          {index < displayPosts.length - 1 && (
            <span className="text-muted-foreground">, </span>
          )}
        </span>
      ))}
    </div>
  );
}
