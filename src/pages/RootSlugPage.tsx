import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { getStorageItem, STORAGE_KEYS } from '@/lib/storage';
import BlogPostPage from './BlogPostPage';
import PillarPage from './PillarPage';
import HubPage from './HubPage';
import NotFound from './NotFound';
import { PillarPage as PillarPageType, Hub } from '@/types/seo';

export default function RootSlugPage() {
    const { slug } = useParams<{ slug: string }>();

    // Determine what type of page this is based on storage/cache
    // Note: For a real app with large data, we might need an async check or API call.
    // But given the current architecture uses localStorage/API sync, we check known lists.

    const pageType = useMemo(() => {
        if (!slug) return '404';

        // 1. Check Pillars
        const pillars = getStorageItem<PillarPageType[]>(STORAGE_KEYS.PILLARS, []);
        if (pillars.some(p => p.slug === slug)) {
            return 'pillar';
        }

        // 2. Check Hubs
        const hubs = getStorageItem<Hub[]>(STORAGE_KEYS.HUBS, []);
        if (hubs.some(h => h.slug === slug)) {
            return 'hub';
        }

        // 3. Default to Blog Post (BlogPostPage handles fetching and 404 if not found)
        return 'post';
    }, [slug]);

    if (pageType === 'pillar') {
        return <PillarPage />;
    }

    if (pageType === 'hub') {
        return <HubPage />;
    }

    if (pageType === 'post') {
        return <BlogPostPage />;
    }

    return <NotFound />;
}
