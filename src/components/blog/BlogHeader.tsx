import { Link } from 'react-router-dom';
import { getSettings } from '@/lib/api';
import { getUploadUrl } from '@/lib/apiClient';
import { useState, useEffect } from 'react';
import { Settings } from '@/types/blog';

export default function BlogHeader() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const siteTitle = settings?.siteTitle || 'Deadloops';

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 gradient-header">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.webp" alt="Deadloops" className="h-8 w-8" />
            <span className="text-xl font-bold">{siteTitle}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
