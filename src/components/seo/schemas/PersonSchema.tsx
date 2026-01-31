// Person Schema Component

import { AuthorSocialLinks } from '@/types/seo';

interface PersonSchemaProps {
  name: string;
  url?: string;
  image?: string | null;
  description?: string;
  jobTitle?: string;
  worksFor?: {
    name: string;
    url?: string;
  };
  sameAs?: string[];
  socialLinks?: AuthorSocialLinks;
  email?: string;
  knowsAbout?: string[];
}

export default function PersonSchema({
  name,
  url,
  image,
  description,
  jobTitle,
  worksFor,
  sameAs,
  socialLinks,
  email,
  knowsAbout,
}: PersonSchemaProps) {
  // Collect sameAs URLs from socialLinks if provided
  const allSameAs = [...(sameAs || [])];
  if (socialLinks) {
    if (socialLinks.twitter) allSameAs.push(socialLinks.twitter);
    if (socialLinks.linkedin) allSameAs.push(socialLinks.linkedin);
    if (socialLinks.github) allSameAs.push(socialLinks.github);
    if (socialLinks.youtube) allSameAs.push(socialLinks.youtube);
    if (socialLinks.instagram) allSameAs.push(socialLinks.instagram);
    if (socialLinks.website) allSameAs.push(socialLinks.website);
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name,
  };

  if (url) schema.url = url;
  if (image) schema.image = image;
  if (description) schema.description = description;
  if (jobTitle) schema.jobTitle = jobTitle;
  if (email) schema.email = email;
  if (knowsAbout && knowsAbout.length > 0) schema.knowsAbout = knowsAbout;

  if (worksFor) {
    schema.worksFor = {
      '@type': 'Organization',
      name: worksFor.name,
      ...(worksFor.url && { url: worksFor.url }),
    };
  }

  if (allSameAs.length > 0) {
    schema.sameAs = allSameAs;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Helper to create Person schema data
export function createPersonSchema(data: PersonSchemaProps): object {
  const allSameAs = [...(data.sameAs || [])];
  if (data.socialLinks) {
    if (data.socialLinks.twitter) allSameAs.push(data.socialLinks.twitter);
    if (data.socialLinks.linkedin) allSameAs.push(data.socialLinks.linkedin);
    if (data.socialLinks.github) allSameAs.push(data.socialLinks.github);
    if (data.socialLinks.youtube) allSameAs.push(data.socialLinks.youtube);
    if (data.socialLinks.instagram) allSameAs.push(data.socialLinks.instagram);
    if (data.socialLinks.website) allSameAs.push(data.socialLinks.website);
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
  };

  if (data.url) schema.url = data.url;
  if (data.image) schema.image = data.image;
  if (data.description) schema.description = data.description;
  if (data.jobTitle) schema.jobTitle = data.jobTitle;
  if (data.email) schema.email = data.email;
  if (data.knowsAbout && data.knowsAbout.length > 0) schema.knowsAbout = data.knowsAbout;

  if (data.worksFor) {
    schema.worksFor = {
      '@type': 'Organization',
      name: data.worksFor.name,
      ...(data.worksFor.url && { url: data.worksFor.url }),
    };
  }

  if (allSameAs.length > 0) schema.sameAs = allSameAs;

  return schema;
}
