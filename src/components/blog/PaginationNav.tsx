import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // e.g., "/" or "/author/john-doe"
}

function getPageUrl(baseUrl: string, page: number): string {
  if (page === 1) {
    return baseUrl === '/' ? '/' : baseUrl;
  }
  const cleanBase = baseUrl === '/' ? '' : baseUrl;
  return `${cleanBase}/page/${page}`;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  // Show ellipsis if current > 3
  if (current > 3) {
    pages.push('ellipsis');
  }

  // Show current and neighbors
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Show ellipsis if current < total - 2
  if (current < total - 2) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (!pages.includes(total)) {
    pages.push(total);
  }

  return pages;
}

export default function PaginationNav({ currentPage, totalPages, baseUrl }: PaginationNavProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const prevUrl = currentPage > 1 ? getPageUrl(baseUrl, currentPage - 1) : null;
  const nextUrl = currentPage < totalPages ? getPageUrl(baseUrl, currentPage + 1) : null;

  return (
    <nav 
      className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
      aria-label="Pagination navigation"
    >
      {/* Mobile: Current page indicator */}
      <div className="sm:hidden text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Previous Button */}
        {prevUrl ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={prevUrl} aria-label="Go to previous page">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
              <span className="sm:hidden ml-1">Prev</span>
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled aria-disabled="true">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
            <span className="sm:hidden ml-1">Prev</span>
          </Button>
        )}

        {/* Page Numbers - Hidden on very small screens */}
        <div className="hidden xs:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isActive = page === currentPage;
            const url = getPageUrl(baseUrl, page);

            return (
              <Button
                key={page}
                variant={isActive ? 'default' : 'outline'}
                size="icon"
                className={cn(
                  'h-9 w-9',
                  isActive && 'pointer-events-none'
                )}
                asChild={!isActive}
                aria-label={`Go to page ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive ? (
                  <span>{page}</span>
                ) : (
                  <Link to={url}>{page}</Link>
                )}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        {nextUrl ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={nextUrl} aria-label="Go to next page">
              <span className="hidden sm:inline mr-1">Next</span>
              <span className="sm:hidden mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled aria-disabled="true">
            <span className="hidden sm:inline mr-1">Next</span>
            <span className="sm:hidden mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile: Page numbers in second row */}
      <div className="flex xs:hidden items-center gap-1 flex-wrap justify-center">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-mobile-${index}`}
                className="px-1 text-muted-foreground text-sm"
                aria-hidden="true"
              >
                …
              </span>
            );
          }

          const isActive = page === currentPage;
          const url = getPageUrl(baseUrl, page);

          return (
            <Button
              key={page}
              variant={isActive ? 'default' : 'outline'}
              size="icon"
              className={cn(
                'h-8 w-8 text-xs',
                isActive && 'pointer-events-none'
              )}
              asChild={!isActive}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive ? (
                <span>{page}</span>
              ) : (
                <Link to={url}>{page}</Link>
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
