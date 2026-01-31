// Organization Schema Component

interface OrganizationSchemaProps {
  name: string;
  url?: string;
  logo?: string | null;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  foundingDate?: string;
}

export default function OrganizationSchema({
  name,
  url,
  logo,
  description,
  sameAs,
  contactPoint,
  address,
  foundingDate,
}: OrganizationSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: name,
  };

  if (url) schema.url = url;
  if (description) schema.description = description;
  if (foundingDate) schema.foundingDate = foundingDate;

  if (logo) {
    schema.logo = {
      '@type': 'ImageObject',
      url: logo,
    };
  }

  if (sameAs && sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  if (contactPoint) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      ...(contactPoint.telephone && { telephone: contactPoint.telephone }),
      ...(contactPoint.email && { email: contactPoint.email }),
      contactType: contactPoint.contactType || 'customer service',
    };
  }

  if (address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(address.streetAddress && { streetAddress: address.streetAddress }),
      ...(address.addressLocality && { addressLocality: address.addressLocality }),
      ...(address.addressRegion && { addressRegion: address.addressRegion }),
      ...(address.postalCode && { postalCode: address.postalCode }),
      ...(address.addressCountry && { addressCountry: address.addressCountry }),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Helper to create Organization schema data
export function createOrganizationSchema(data: OrganizationSchemaProps): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
  };

  if (data.url) schema.url = data.url;
  if (data.description) schema.description = data.description;
  if (data.foundingDate) schema.foundingDate = data.foundingDate;

  if (data.logo) {
    schema.logo = {
      '@type': 'ImageObject',
      url: data.logo,
    };
  }

  if (data.sameAs && data.sameAs.length > 0) schema.sameAs = data.sameAs;

  if (data.contactPoint) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      ...(data.contactPoint.telephone && { telephone: data.contactPoint.telephone }),
      ...(data.contactPoint.email && { email: data.contactPoint.email }),
      contactType: data.contactPoint.contactType || 'customer service',
    };
  }

  if (data.address) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(data.address.streetAddress && { streetAddress: data.address.streetAddress }),
      ...(data.address.addressLocality && { addressLocality: data.address.addressLocality }),
      ...(data.address.addressRegion && { addressRegion: data.address.addressRegion }),
      ...(data.address.postalCode && { postalCode: data.address.postalCode }),
      ...(data.address.addressCountry && { addressCountry: data.address.addressCountry }),
    };
  }

  return schema;
}

// WebSite schema for homepage
export function createWebSiteSchema(
  name: string,
  url: string,
  description?: string,
  searchUrl?: string
): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: name,
    url: url,
  };

  if (description) schema.description = description;

  if (searchUrl) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrl,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}
