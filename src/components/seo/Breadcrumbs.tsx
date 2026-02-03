import { Link } from 'react-router-dom';
import { BreadcrumbItem } from '@/types/seo';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
  homeLabel?: string;
}

export default function Breadcrumbs({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />,
  showHome = true,
  homeLabel = 'Home',
}: BreadcrumbsProps) {
  // Build full breadcrumb list with home
  const fullItems: BreadcrumbItem[] = showHome
    ? [{ name: homeLabel, url: '/', position: 0 }, ...items.map((item, i) => ({ ...item, position: i + 1 }))]
    : items.map((item, i) => ({ ...item, position: i }));

  // Generate JSON-LD for BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${typeof window !== 'undefined' ? window.location.origin : ''}${item.url}`,
    })),
  };

  const isLast = (index: number) => index === fullItems.length - 1;

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className={cn('flex items-center text-sm', className)}
      >
        <ol className="flex items-center gap-1.5 flex-wrap">
          {fullItems.map((item, index) => (
            <li key={item.url} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="flex-shrink-0">
                  {separator}
                </span>
              )}
              
              {isLast(index) ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {index === 0 && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span className="sr-only">{item.name}</span>
                    </span>
                  ) : (
                    item.name
                  )}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {index === 0 && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span className="sr-only">{item.name}</span>
                    </span>
                  ) : (
                    item.name
                  )}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Helper to generate breadcrumb items from path
export function generateBreadcrumbsFromPath(
  path: string,
  labelMap?: Record<string, string>
): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Get label from map or format segment
    const label = labelMap?.[segment] || formatSegment(segment);
    
    items.push({
      name: label,
      url: currentPath,
      position: i + 1,
    });
  }

  return items;
}

// Format URL segment to readable label
function formatSegment(segment: string): string {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
