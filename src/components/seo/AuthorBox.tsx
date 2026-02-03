import { Link } from 'react-router-dom';
import { Author, AuthorSocialLinks } from '@/types/seo';
import { cn } from '@/lib/utils';
import { Twitter, Linkedin, Github, Globe, ArrowRight, Youtube, Instagram } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AuthorBoxProps {
  author: Author;
  className?: string;
  showBio?: boolean;
  showCredentials?: boolean;
  showSocialLinks?: boolean;
  showMoreLink?: boolean;
  compact?: boolean;
}

export default function AuthorBox({
  author,
  className,
  showBio = true,
  showCredentials = true,
  showSocialLinks = true,
  showMoreLink = true,
  compact = false,
}: AuthorBoxProps) {
  // Generate JSON-LD Person schema
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: author.socialLinks.website || `${typeof window !== 'undefined' ? window.location.origin : ''}/author/${author.slug}`,
    ...(author.image && { image: author.image }),
    ...(author.bio && { description: author.bio }),
    ...(author.credentials && { jobTitle: author.credentials }),
    sameAs: getSameAsUrls(author.socialLinks),
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={author.image || undefined} alt={author.name} loading="lazy" />
          <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
        </Avatar>
        <div>
          <Link
            to={`/author/${author.slug}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {author.name}
          </Link>
          {showCredentials && author.credentials && (
            <p className="text-sm text-muted-foreground">{author.credentials}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div
        className={cn(
          'rounded-lg border bg-card p-6',
          className
        )}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Author Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={author.image || undefined}
                alt={author.name}
                loading="lazy"
              />
              <AvatarFallback className="text-2xl">
                {getInitials(author.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <Link
                  to={`/author/${author.slug}`}
                  className="text-lg font-semibold hover:text-primary transition-colors"
                >
                  {author.name}
                </Link>
                {showCredentials && author.credentials && (
                  <p className="text-sm text-muted-foreground">
                    {author.credentials}
                  </p>
                )}
              </div>

              {/* Social Links */}
              {showSocialLinks && (
                <div className="flex items-center gap-1">
                  {author.socialLinks.twitter && (
                    <SocialLink href={author.socialLinks.twitter} label="Twitter">
                      <Twitter className="h-4 w-4" />
                    </SocialLink>
                  )}
                  {author.socialLinks.linkedin && (
                    <SocialLink href={author.socialLinks.linkedin} label="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </SocialLink>
                  )}
                  {author.socialLinks.github && (
                    <SocialLink href={author.socialLinks.github} label="GitHub">
                      <Github className="h-4 w-4" />
                    </SocialLink>
                  )}
                  {author.socialLinks.youtube && (
                    <SocialLink href={author.socialLinks.youtube} label="YouTube">
                      <Youtube className="h-4 w-4" />
                    </SocialLink>
                  )}
                  {author.socialLinks.instagram && (
                    <SocialLink href={author.socialLinks.instagram} label="Instagram">
                      <Instagram className="h-4 w-4" />
                    </SocialLink>
                  )}
                  {author.socialLinks.website && (
                    <SocialLink href={author.socialLinks.website} label="Website">
                      <Globe className="h-4 w-4" />
                    </SocialLink>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            {showBio && author.bio && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {author.bio}
              </p>
            )}

            {/* Expertise Tags */}
            {author.expertise && author.expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {author.expertise.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* More Link */}
            {showMoreLink && (
              <Button variant="link" asChild className="p-0 h-auto">
                <Link to={`/author/${author.slug}`}>
                  More from {author.name}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Social link button component
function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {children}
    </a>
  );
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Get sameAs URLs for schema
function getSameAsUrls(socialLinks: AuthorSocialLinks): string[] {
  const urls: string[] = [];
  if (socialLinks.twitter) urls.push(socialLinks.twitter);
  if (socialLinks.linkedin) urls.push(socialLinks.linkedin);
  if (socialLinks.github) urls.push(socialLinks.github);
  if (socialLinks.youtube) urls.push(socialLinks.youtube);
  if (socialLinks.instagram) urls.push(socialLinks.instagram);
  if (socialLinks.website) urls.push(socialLinks.website);
  return urls;
}

// Empty author template for site owner to fill
export function createEmptyAuthor(id: string, name: string, slug: string): Author {
  return {
    id,
    name,
    slug,
    bio: '', // To be filled by site owner
    credentials: '', // To be filled by site owner
    image: null,
    socialLinks: {
      twitter: null,
      linkedin: null,
      github: null,
      website: null,
      youtube: null,
      instagram: null,
    },
    expertise: [],
    isActive: true,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
