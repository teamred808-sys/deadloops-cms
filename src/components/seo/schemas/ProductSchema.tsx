// Product Schema Component

interface ProductSchemaProps {
  name: string;
  description: string;
  image?: string | null;
  brand?: string;
  sku?: string;
  price?: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued';
  url?: string;
  review?: {
    rating: number;
    reviewCount?: number;
  };
  category?: string;
}

export default function ProductSchema({
  name,
  description,
  image,
  brand,
  sku,
  price,
  priceCurrency = 'USD',
  availability = 'InStock',
  url,
  review,
  category,
}: ProductSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
  };

  if (image) {
    schema.image = image;
  }

  if (brand) {
    schema.brand = {
      '@type': 'Brand',
      name: brand,
    };
  }

  if (sku) {
    schema.sku = sku;
  }

  if (price !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: price,
      priceCurrency: priceCurrency,
      availability: `https://schema.org/${availability}`,
      ...(url && { url }),
    };
  }

  if (review) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
      ...(review.reviewCount && { reviewCount: review.reviewCount }),
    };
  }

  if (category) {
    schema.category = category;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Helper to create Product schema data
export function createProductSchema(data: ProductSchemaProps): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
  };

  if (data.image) schema.image = data.image;
  if (data.brand) schema.brand = { '@type': 'Brand', name: data.brand };
  if (data.sku) schema.sku = data.sku;
  if (data.category) schema.category = data.category;

  if (data.price !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.priceCurrency || 'USD',
      availability: `https://schema.org/${data.availability || 'InStock'}`,
      ...(data.url && { url: data.url }),
    };
  }

  if (data.review) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.review.rating,
      bestRating: 5,
      worstRating: 1,
      ...(data.review.reviewCount && { reviewCount: data.review.reviewCount }),
    };
  }

  return schema;
}
