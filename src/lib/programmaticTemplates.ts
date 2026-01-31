// Programmatic Page URL Patterns and Template Logic

import { ProgrammaticPage, ProgrammaticTemplate } from '@/types/seo';
import { musicGenres, Genre } from './musicGenres';
import { generateId } from './storage';

// Template types for programmatic pages
export type TemplateType = 
  | 'best-eq-settings'
  | 'best-drum-kits'
  | 'best-bpm'
  | 'best-vocal-chain'
  | 'best-compression-settings'
  | 'best-reverb'
  | 'best-sample-packs';

export interface TemplateDefinition {
  type: TemplateType;
  name: string;
  titlePattern: string;
  urlPattern: string;
  defaultHub: string;
  defaultPillar: string;
}

// Template definitions with patterns
export const templateDefinitions: TemplateDefinition[] = [
  {
    type: 'best-eq-settings',
    name: 'Best EQ Settings',
    titlePattern: 'Best EQ Settings for {genre}',
    urlPattern: '/genre/{genreSlug}/best-eq-settings',
    defaultHub: 'mixing',
    defaultPillar: 'mixing-mastering-guide',
  },
  {
    type: 'best-drum-kits',
    name: 'Best Drum Kits',
    titlePattern: 'Best Drum Kits for {genre}',
    urlPattern: '/genre/{genreSlug}/best-drum-kits',
    defaultHub: 'samples-loops',
    defaultPillar: 'ultimate-sample-packs-guide',
  },
  {
    type: 'best-bpm',
    name: 'Best BPM',
    titlePattern: 'Best BPM for {genre}',
    urlPattern: '/genre/{genreSlug}/best-bpm',
    defaultHub: 'music-production',
    defaultPillar: 'music-production-for-beginners',
  },
  {
    type: 'best-vocal-chain',
    name: 'Best Vocal Chain',
    titlePattern: 'Best Vocal Chain for {genre}',
    urlPattern: '/genre/{genreSlug}/best-vocal-chain',
    defaultHub: 'mixing',
    defaultPillar: 'mixing-mastering-guide',
  },
  {
    type: 'best-compression-settings',
    name: 'Best Compression Settings',
    titlePattern: 'Best Compression Settings for {genre}',
    urlPattern: '/genre/{genreSlug}/best-compression-settings',
    defaultHub: 'mixing',
    defaultPillar: 'mixing-mastering-guide',
  },
  {
    type: 'best-reverb',
    name: 'Best Reverb',
    titlePattern: 'Best Reverb for {genre}',
    urlPattern: '/genre/{genreSlug}/best-reverb',
    defaultHub: 'mixing',
    defaultPillar: 'mixing-mastering-guide',
  },
  {
    type: 'best-sample-packs',
    name: 'Best Sample Packs',
    titlePattern: 'Best Sample Packs for {genre}',
    urlPattern: '/genre/{genreSlug}/best-sample-packs',
    defaultHub: 'samples-loops',
    defaultPillar: 'ultimate-sample-packs-guide',
  },
];

// Generate title from pattern
export function generateTitle(pattern: string, genre: Genre): string {
  return pattern.replace('{genre}', genre.name);
}

// Generate URL from pattern
export function generateUrl(pattern: string, genre: Genre): string {
  return pattern.replace('{genreSlug}', genre.slug);
}

// Get all possible programmatic page URLs
export function getAllProgrammaticUrls(): { url: string; genre: string; template: string }[] {
  const urls: { url: string; genre: string; template: string }[] = [];
  
  for (const template of templateDefinitions) {
    for (const genre of musicGenres) {
      urls.push({
        url: generateUrl(template.urlPattern, genre),
        genre: genre.name,
        template: template.name,
      });
    }
  }
  
  return urls;
}

// Create a programmatic page instance
export function createProgrammaticPage(
  template: TemplateDefinition,
  genre: Genre
): ProgrammaticPage {
  const now = new Date().toISOString();
  
  return {
    id: generateId(),
    templateId: template.type,
    genre: genre.name,
    genreSlug: genre.slug,
    title: generateTitle(template.titlePattern, genre),
    seoTitle: '', // To be filled by site owner
    metaDescription: '', // To be filled by site owner
    content: '', // Empty content - to be filled by site owner
    hasContent: false,
    noIndex: true, // noIndex until content is added
    linkedHub: template.defaultHub,
    linkedPillar: template.defaultPillar,
    relatedPages: [], // To be populated by internal linking system
    createdAt: now,
    updatedAt: now,
  };
}

// Generate all programmatic pages for a template
export function generatePagesForTemplate(template: TemplateDefinition): ProgrammaticPage[] {
  return musicGenres.map(genre => createProgrammaticPage(template, genre));
}

// Generate all programmatic pages
export function generateAllProgrammaticPages(): ProgrammaticPage[] {
  const pages: ProgrammaticPage[] = [];
  
  for (const template of templateDefinitions) {
    pages.push(...generatePagesForTemplate(template));
  }
  
  return pages;
}

// Get template by type
export function getTemplateByType(type: TemplateType): TemplateDefinition | undefined {
  return templateDefinitions.find(t => t.type === type);
}

// Get related programmatic pages (same genre, different templates)
export function getRelatedByGenre(genreSlug: string, currentTemplate: TemplateType): ProgrammaticPage[] {
  return templateDefinitions
    .filter(t => t.type !== currentTemplate)
    .map(t => {
      const genre = musicGenres.find(g => g.slug === genreSlug);
      if (!genre) return null;
      return createProgrammaticPage(t, genre);
    })
    .filter((p): p is ProgrammaticPage => p !== null)
    .slice(0, 3);
}

// Get related programmatic pages (same template, different genres)
export function getRelatedByTemplate(template: TemplateType, currentGenreSlug: string): ProgrammaticPage[] {
  const templateDef = getTemplateByType(template);
  if (!templateDef) return [];
  
  const currentGenre = musicGenres.find(g => g.slug === currentGenreSlug);
  if (!currentGenre) return [];
  
  // Get related genres first, then other genres
  const relatedGenreSlugs = currentGenre.relatedGenres;
  const relatedGenres = musicGenres.filter(g => 
    relatedGenreSlugs.includes(g.slug) && g.slug !== currentGenreSlug
  );
  
  return relatedGenres.slice(0, 3).map(genre => createProgrammaticPage(templateDef, genre));
}

// Count total programmatic pages
export function getTotalProgrammaticPageCount(): number {
  return templateDefinitions.length * musicGenres.length;
}

// Parse URL to get genre and template type
export function parseUrl(url: string): { genreSlug: string; templateType: TemplateType } | null {
  const match = url.match(/^\/genre\/([^\/]+)\/([^\/]+)\/?$/);
  if (!match) return null;
  
  const [, genreSlug, templateType] = match;
  
  const template = templateDefinitions.find(t => t.type === templateType);
  if (!template) return null;
  
  const genre = musicGenres.find(g => g.slug === genreSlug);
  if (!genre) return null;
  
  return { genreSlug, templateType: templateType as TemplateType };
}
