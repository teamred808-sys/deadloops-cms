import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  maxDepth?: number;
  smooth?: boolean;
}

export default function TableOfContents({
  content,
  className,
  title = 'Table of Contents',
  collapsible = true,
  defaultCollapsed = false,
  maxDepth = 3,
  smooth = true,
}: TableOfContentsProps) {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Parse headings from HTML content
  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const tocItems: TOCItem[] = [];
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      // Skip if beyond max depth (h1 = 1, h2 = 2, etc.)
      if (level > maxDepth) return;
      
      const text = heading.textContent?.trim() || '';
      if (!text) return;
      
      // Generate ID from text
      const id = heading.id || generateId(text, index);
      
      tocItems.push({ id, text, level });
    });
    
    setItems(tocItems);
  }, [content, maxDepth]);

  // Track active heading based on scroll position
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      if (smooth) {
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: y });
      }
    }
  }, [smooth]);

  if (items.length === 0) {
    return null;
  }

  // Find minimum heading level to normalize indentation
  const minLevel = Math.min(...items.map(item => item.level));

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        'rounded-lg border bg-card p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <List className="h-4 w-4" />
          {title}
        </h2>
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* TOC List */}
      {!isCollapsed && (
        <ol className="space-y-1 text-sm">
          {items.map((item) => {
            const indent = (item.level - minLevel) * 12;
            const isActive = activeId === item.id;
            
            return (
              <li
                key={item.id}
                style={{ paddingLeft: `${indent}px` }}
              >
                <button
                  onClick={() => scrollToHeading(item.id)}
                  className={cn(
                    'w-full text-left py-1 px-2 rounded-md transition-colors hover:bg-muted',
                    isActive
                      ? 'text-primary font-medium bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.text}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}

// Generate a URL-friendly ID from text
function generateId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return slug || `heading-${index}`;
}

// Helper to add IDs to headings in HTML content
export function addHeadingIds(content: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  headings.forEach((heading, index) => {
    if (!heading.id) {
      const text = heading.textContent?.trim() || '';
      heading.id = generateId(text, index);
    }
  });
  
  return doc.body.innerHTML;
}

// Extract headings for external use
export function extractHeadings(content: string, maxDepth: number = 3): TOCItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  const items: TOCItem[] = [];
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > maxDepth) return;
    
    const text = heading.textContent?.trim() || '';
    if (!text) return;
    
    const id = heading.id || generateId(text, index);
    items.push({ id, text, level });
  });
  
  return items;
}
