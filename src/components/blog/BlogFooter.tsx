import { Link } from 'react-router-dom';
import { getSettings, getPublishedFooterPages } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Settings, FooterPage } from '@/types/blog';

export default function BlogFooter() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [footerPages, setFooterPages] = useState<FooterPage[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    getSettings().then(setSettings);
    getPublishedFooterPages().then(pages => {
      // Filter to only show pages marked for footer and sort by order
      const visiblePages = pages
        .filter(p => p.showInFooter)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setFooterPages(visiblePages);
    });
  }, []);

  const siteTitle = settings?.siteTitle || 'Deadloops';
  const tagline = settings?.tagline || 'Music Production Resources & Tutorials';

  return (
    <footer className="border-t border-border/50 gradient-header">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="font-semibold">{siteTitle}</p>
            <p className="text-sm text-muted-foreground">{tagline}</p>
          </div>
          
          {/* Footer Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            {footerPages.map((page, index) => (
              <span key={page.id} className="flex items-center gap-4">
                <span className="text-muted-foreground/50">•</span>
                <Link 
                  to={`/p/${page.slug}`} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {page.title}
                </Link>
              </span>
            ))}
          </nav>
          
          <p className="text-sm text-muted-foreground">
            © {currentYear} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
