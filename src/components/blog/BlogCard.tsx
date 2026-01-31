import { Link } from 'react-router-dom';
import { Post, Category } from '@/types/blog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatDate } from '@/lib/storage';
import { Calendar, User } from 'lucide-react';

interface BlogCardProps {
  post: Post;
  categories: Category[];
  priority?: boolean;
}

export default function BlogCard({ post, categories, priority = false }: BlogCardProps) {
  const postCategories = categories.filter(cat => post.categories.includes(cat.id));

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 gradient-card border-border/50 hover:glow-primary">
      <div className="flex flex-row md:flex-col">
        {/* Image Section */}
        <Link to={`/blog/${post.slug}`} className="flex-shrink-0">
          {post.featuredImage ? (
            <div className="w-20 h-20 md:w-full md:h-auto md:aspect-video overflow-hidden rounded-lg md:rounded-none m-2 md:m-0">
              <img
                src={post.featuredImage}
                alt={post.title}
                width={320}
                height={180}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                decoding={priority ? 'sync' : 'async'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div 
              className="w-20 h-20 md:w-full md:h-auto md:aspect-video bg-muted flex items-center justify-center rounded-lg md:rounded-none m-2 md:m-0"
              style={{ minHeight: '80px' }}
            >
              <span className="text-muted-foreground text-2xl md:text-4xl">📝</span>
            </div>
          )}
        </Link>

        {/* Content Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <CardContent className="p-2 md:p-4 flex-1">
            {/* Categories */}
            {postCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {postCategories.slice(0, 2).map((category, index) => (
                  <Badge 
                    key={category.id} 
                    variant="secondary" 
                    className={`text-xs ${index > 0 ? 'hidden md:inline-flex' : 'inline-flex'}`}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Title */}
            <Link to={`/blog/${post.slug}`}>
              <h2 className="text-base md:text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-1 md:mb-2">
                {post.title}
              </h2>
            </Link>

            {/* Excerpt */}
            <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3 hidden md:block">
              {post.excerpt}
            </p>
          </CardContent>

          <CardFooter className="p-2 md:p-4 pt-0 flex items-center gap-2 md:gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px] md:max-w-none">{post.author}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishDate)}
            </span>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
