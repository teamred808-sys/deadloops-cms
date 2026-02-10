// BlogPosting Schema Component

interface BlogPostingSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo?: string;
  };
  image?: string | null;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}

export default function BlogPostingSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  author,
  publisher,
  image,
  keywords,
  articleSection,
  wordCount,
}: BlogPostingSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    url: url,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: publisher.name,
      ...(publisher.logo && {
        logo: {
          '@type': 'ImageObject',
          url: publisher.logo,
        },
      }),
    },
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
    ...(keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
    ...(articleSection && { articleSection }),
    ...(wordCount && { wordCount }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Helper to create BlogPosting schema data
export function createBlogPostingSchema(data: BlogPostingSchemaProps): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    url: data.url,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      '@type': 'Person',
      name: data.author.name,
      ...(data.author.url && { url: data.author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher.name,
      ...(data.publisher.logo && {
        logo: {
          '@type': 'ImageObject',
          url: data.publisher.logo,
        },
      }),
    },
    ...(data.image && {
      image: {
        '@type': 'ImageObject',
        url: data.image,
      },
    }),
    ...(data.keywords && data.keywords.length > 0 && { keywords: data.keywords.join(', ') }),
    ...(data.articleSection && { articleSection: data.articleSection }),
    ...(data.wordCount && { wordCount: data.wordCount }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
  };
}
