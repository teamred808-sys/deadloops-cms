import { Link } from 'react-router-dom';
import { InternalLink } from '@/types/seo';
import { cn } from '@/lib/utils';
import { ArrowUpRight, BookOpen, FolderOpen, FileText } from 'lucide-react';

interface InternalLinksModuleProps {
  links: InternalLink[];
  className?: string;
  title?: string;
  showIcons?: boolean;
}

export default function InternalLinksModule({
  links,
  className,
  title = 'Further Reading',
  showIcons = true,
}: InternalLinksModuleProps) {
  if (links.length === 0) {
    return null;
  }

  // Group links by type
  const pillarLinks = links.filter((l) => l.linkType === 'pillar');
  const hubLinks = links.filter((l) => l.linkType === 'hub');
  const relatedLinks = links.filter((l) => l.linkType === 'related' || l.linkType === 'cluster');

  return (
    <aside
      className={cn(
        'rounded-lg border bg-card p-4',
        className
      )}
    >
      <h3 className="text-sm font-semibold mb-3">{title}</h3>

      <div className="space-y-4">
        {/* Pillar Links - Most Important */}
        {pillarLinks.length > 0 && (
          <LinkGroup
            links={pillarLinks}
            icon={showIcons ? <BookOpen className="h-4 w-4 text-primary" /> : null}
            label="Comprehensive Guide"
          />
        )}

        {/* Hub Links - Category Pages */}
        {hubLinks.length > 0 && (
          <LinkGroup
            links={hubLinks}
            icon={showIcons ? <FolderOpen className="h-4 w-4 text-amber-500" /> : null}
            label="Browse Category"
          />
        )}

        {/* Related/Cluster Links */}
        {relatedLinks.length > 0 && (
          <LinkGroup
            links={relatedLinks}
            icon={showIcons ? <FileText className="h-4 w-4 text-muted-foreground" /> : null}
            label="Related Articles"
          />
        )}
      </div>
    </aside>
  );
}

// Link group component
function LinkGroup({
  links,
  icon,
  label,
}: {
  links: InternalLink[];
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.targetUrl}>
            <Link
              to={link.targetUrl}
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors group py-1"
            >
              {icon}
              <span className="flex-1">{link.anchorText}</span>
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Inline internal links for embedding in content
export function InternalLinkInline({
  link,
  className,
}: {
  link: InternalLink;
  className?: string;
}) {
  return (
    <Link
      to={link.targetUrl}
      className={cn(
        'text-primary hover:underline inline-flex items-center gap-1',
        className
      )}
    >
      {link.anchorText}
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

// Contextual link box for embedding in article content
export function InternalLinkBox({
  link,
  description,
  className,
}: {
  link: InternalLink;
  description?: string;
  className?: string;
}) {
  const getIcon = () => {
    switch (link.linkType) {
      case 'pillar':
        return <BookOpen className="h-5 w-5 text-primary" />;
      case 'hub':
        return <FolderOpen className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Link
      to={link.targetUrl}
      className={cn(
        'block rounded-lg border bg-muted/30 p-4 hover:bg-muted/50 transition-colors group',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <p className="font-medium group-hover:text-primary transition-colors">
            {link.anchorText}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </Link>
  );
}

// Empty link placeholder for admin to configure
export function InternalLinkPlaceholder({
  type,
  className,
}: {
  type: 'pillar' | 'hub' | 'related';
  className?: string;
}) {
  const labels = {
    pillar: 'Add Pillar Link',
    hub: 'Add Hub Link',
    related: 'Add Related Link',
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-center text-muted-foreground',
        className
      )}
    >
      <p className="text-sm">{labels[type]}</p>
      <p className="text-xs mt-1">Configure in post editor</p>
    </div>
  );
}
