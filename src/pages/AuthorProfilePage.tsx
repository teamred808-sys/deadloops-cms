import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getAuthorBySlug, getPostsByAuthor, getCategories } from '@/lib/api';
import { Author } from '@/types/seo';
import { Post, Category } from '@/types/blog';
import BlogHeader from '@/components/blog/BlogHeader';
import BlogFooter from '@/components/blog/BlogFooter';
import BlogCard from '@/components/blog/BlogCard';
import PaginationNav from '@/components/blog/PaginationNav';
import SEOHead from '@/components/seo/SEOHead';
import PersonSchema from '@/components/seo/schemas/PersonSchema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  Twitter, 
  Linkedin, 
  Github, 
  Globe, 
  Youtube, 
  Instagram,
  FileText,
} from 'lucide-react';

const POSTS_PER_PAGE = 10;

export default function AuthorProfilePage() {
  const { authorSlug, pageNumber } = useParams();
  const currentPage = pageNumber ? parseInt(pageNumber, 10) : 1;
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorSlug) return;

    Promise.all([
      getAuthorBySlug(authorSlug),
      getCategories(),
    ]).then(async ([authorData, categoriesData]) => {
      setAuthor(authorData);
      setCategories(categoriesData);
      
      if (authorData) {
        const authorPosts = await getPostsByAuthor(authorData.id);
        setPosts(authorPosts);
      }
      setLoading(false);
    });
  }, [authorSlug]);

  // Validate page number - redirect invalid pages
  if (pageNumber && (isNaN(currentPage) || currentPage < 1)) {
    return <Navigate to={`/author/${authorSlug}`} replace />;
  }

  // Calculate pagination
  const totalPages = useMemo(() => Math.ceil(posts.length / POSTS_PER_PAGE), [posts.length]);
  
  // Redirect if page exceeds total (only after loading)
  if (!loading && author && currentPage > totalPages && totalPages > 0) {
    return <Navigate to={`/author/${authorSlug}`} replace />;
  }

  const paginatedPosts = useMemo(() => {
    return posts.slice(
      (currentPage - 1) * POSTS_PER_PAGE,
      currentPage * POSTS_PER_PAGE
    );
  }, [posts, currentPage]);

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

  if (!author) {
    return (
      <div className="min-h-screen flex flex-col">
        <BlogHeader />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Author Not Found</h1>
          <p className="text-muted-foreground mb-8">The author you're looking for doesn't exist.</p>
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

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const socialLinks = [
    { key: 'twitter', icon: Twitter, href: author.socialLinks?.twitter },
    { key: 'linkedin', icon: Linkedin, href: author.socialLinks?.linkedin },
    { key: 'github', icon: Github, href: author.socialLinks?.github },
    { key: 'youtube', icon: Youtube, href: author.socialLinks?.youtube },
    { key: 'instagram', icon: Instagram, href: author.socialLinks?.instagram },
    { key: 'website', icon: Globe, href: author.socialLinks?.website },
  ].filter(link => link.href);

  // SEO: Dynamic title and canonical
  const pageTitle = currentPage === 1 
    ? `Posts by ${author.name}`
    : `Posts by ${author.name} - Page ${currentPage}`;
  
  const canonical = currentPage === 1 
    ? `/author/${author.slug}` 
    : `/author/${author.slug}/page/${currentPage}`;

  const baseUrl = `/author/${author.slug}`;

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <SEOHead
        title={pageTitle}
        description={author.bio || `Read articles and posts by ${author.name}`}
        canonical={canonical}
        ogType="profile"
      />
      
      <PersonSchema
        name={author.name}
        url={`${window.location.origin}/author/${author.slug}`}
        image={author.image}
        description={author.bio}
        jobTitle={author.credentials}
        socialLinks={author.socialLinks}
        knowsAbout={author.expertise}
      />

      <BlogHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          {/* Author Profile Header */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-xl border p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <Avatar className="h-24 w-24 md:h-32 md:w-32 shrink-0">
                  <AvatarImage 
                    src={author.image || undefined} 
                    alt={author.name}
                    loading="lazy"
                  />
                  <AvatarFallback className="text-2xl md:text-3xl">
                    {getInitials(author.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">{author.name}</h1>
                  {author.credentials && (
                    <p className="text-lg text-muted-foreground mb-3">{author.credentials}</p>
                  )}
                  
                  {author.bio && (
                    <p className="text-muted-foreground mb-4 leading-relaxed">{author.bio}</p>
                  )}

                  {/* Expertise Tags */}
                  {author.expertise && author.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {author.expertise.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Social Links */}
                  {socialLinks.length > 0 && (
                    <div className="flex items-center gap-2">
                      {socialLinks.map(({ key, icon: Icon, href }) => (
                        <a
                          key={key}
                          href={href!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label={key}
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Count */}
                <div className="flex md:flex-col items-center gap-2 p-4 bg-muted rounded-lg text-center">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{posts.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {posts.length === 1 ? 'Post' : 'Posts'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts by Author */}
            <div>
              <h2 className="text-xl font-bold mb-6">
                Posts by {author.name}
                {currentPage > 1 && <span className="text-muted-foreground font-normal"> - Page {currentPage}</span>}
              </h2>
              
              {paginatedPosts.length > 0 ? (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedPosts.map((post) => (
                      <BlogCard key={post.id} post={post} categories={categories} />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <PaginationNav
                    currentPage={currentPage}
                    totalPages={totalPages}
                    baseUrl={baseUrl}
                  />
                </>
              ) : (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No posts published yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}
