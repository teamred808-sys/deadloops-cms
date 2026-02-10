// Music Genres Dataset for Programmatic SEO

export interface Genre {
  name: string;
  slug: string;
  parentGenre: string | null;
  relatedGenres: string[];
}

export const musicGenres: Genre[] = [
  { name: 'Hip Hop', slug: 'hip-hop', parentGenre: null, relatedGenres: ['trap', 'drill', 'lo-fi'] },
  { name: 'Trap', slug: 'trap', parentGenre: 'hip-hop', relatedGenres: ['hip-hop', 'drill', 'edm'] },
  { name: 'EDM', slug: 'edm', parentGenre: null, relatedGenres: ['house', 'techno', 'trap'] },
  { name: 'Techno', slug: 'techno', parentGenre: 'edm', relatedGenres: ['house', 'edm'] },
  { name: 'House', slug: 'house', parentGenre: 'edm', relatedGenres: ['techno', 'edm'] },
  { name: 'Lo-Fi', slug: 'lo-fi', parentGenre: null, relatedGenres: ['hip-hop', 'indie'] },
  { name: 'Bollywood', slug: 'bollywood', parentGenre: null, relatedGenres: ['punjabi', 'pop'] },
  { name: 'Punjabi', slug: 'punjabi', parentGenre: null, relatedGenres: ['bollywood', 'pop'] },
  { name: 'Pop', slug: 'pop', parentGenre: null, relatedGenres: ['indie', 'rock'] },
  { name: 'Rock', slug: 'rock', parentGenre: null, relatedGenres: ['metal', 'indie', 'pop'] },
  { name: 'Metal', slug: 'metal', parentGenre: 'rock', relatedGenres: ['rock'] },
  { name: 'Indie', slug: 'indie', parentGenre: null, relatedGenres: ['pop', 'rock', 'lo-fi'] },
  { name: 'Drill', slug: 'drill', parentGenre: 'hip-hop', relatedGenres: ['hip-hop', 'trap'] },
  { name: 'Afrobeat', slug: 'afrobeat', parentGenre: null, relatedGenres: ['reggaeton', 'pop'] },
  { name: 'Reggaeton', slug: 'reggaeton', parentGenre: null, relatedGenres: ['afrobeat', 'pop', 'hip-hop'] },
];

export function getGenreBySlug(slug: string): Genre | undefined {
  return musicGenres.find(g => g.slug === slug);
}

export function getGenreByName(name: string): Genre | undefined {
  return musicGenres.find(g => g.name.toLowerCase() === name.toLowerCase());
}

export function getRelatedGenres(slug: string): Genre[] {
  const genre = getGenreBySlug(slug);
  if (!genre) return [];
  return genre.relatedGenres
    .map(s => getGenreBySlug(s))
    .filter((g): g is Genre => g !== undefined);
}

export function getAllGenreSlugs(): string[] {
  return musicGenres.map(g => g.slug);
}
