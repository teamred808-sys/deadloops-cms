// BreadcrumbList Schema Component

import { BreadcrumbItem } from '@/types/seo';

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
  baseUrl?: string;
}

export default function BreadcrumbSchema({ items, baseUrl }: BreadcrumbSchemaProps) {
  if (items.length === 0) return null;

  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${base}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Helper to create BreadcrumbList schema data
export function createBreadcrumbSchema(items: BreadcrumbItem[], baseUrl?: string): object | null {
  if (items.length === 0) return null;

  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${base}${item.url}`,
    })),
  };
}
