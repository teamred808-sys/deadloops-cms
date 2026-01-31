import { Post, Category, Tag, Settings, User, Media } from '@/types/blog';
import { generateId } from './storage';

export const defaultSettings: Settings = {
  siteTitle: 'Deadloops',
  tagline: 'Music Production Resources & Tutorials',
  logo: null,
  postsPerPage: 10,
  downloadTimerDuration: 15,
  adBlockerDetectionEnabled: true,
  adBlockerMessage: 'Please disable your ad blocker to support our site and access downloads.',
  googleAdsEnabled: false,
  googleAdsClientId: '',
  googleAdsDisplaySlotId: '',
  googleAdsInFeedSlotId: '',
  googleAdsInArticleSlotId: '',
  googleAdsMultiplexSlotId: '',
  googleAdsCode: '',
};

export const sampleCategories: Category[] = [
  {
    id: 'cat-mixing',
    name: 'Mixing',
    slug: 'mixing',
    description: 'Mixing tutorials, techniques, and tips for better sound',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-mastering',
    name: 'Mastering',
    slug: 'mastering',
    description: 'Mastering guides to get your tracks release-ready',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-production',
    name: 'Music Production',
    slug: 'music-production',
    description: 'Beat making, arrangement, and production techniques',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-plugins',
    name: 'Plugins & VST',
    slug: 'plugins-vst',
    description: 'VST plugins, instruments, and effects reviews',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-gear',
    name: 'Gear Reviews',
    slug: 'gear-reviews',
    description: 'Studio equipment, hardware, and gear recommendations',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-samples',
    name: 'Samples & Loops',
    slug: 'samples-loops',
    description: 'Sample packs, drum kits, and loop resources',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-theory',
    name: 'Music Theory',
    slug: 'music-theory',
    description: 'Music theory fundamentals for producers',
    createdAt: new Date().toISOString(),
  },
];

export const sampleTags: Tag[] = [
  { id: 'tag-fl-studio', name: 'FL Studio', slug: 'fl-studio', createdAt: new Date().toISOString() },
  { id: 'tag-ableton', name: 'Ableton Live', slug: 'ableton-live', createdAt: new Date().toISOString() },
  { id: 'tag-hip-hop', name: 'Hip Hop', slug: 'hip-hop', createdAt: new Date().toISOString() },
  { id: 'tag-trap', name: 'Trap', slug: 'trap', createdAt: new Date().toISOString() },
  { id: 'tag-edm', name: 'EDM', slug: 'edm', createdAt: new Date().toISOString() },
  { id: 'tag-vocals', name: 'Vocals', slug: 'vocals', createdAt: new Date().toISOString() },
  { id: 'tag-compression', name: 'Compression', slug: 'compression', createdAt: new Date().toISOString() },
  { id: 'tag-eq', name: 'EQ', slug: 'eq', createdAt: new Date().toISOString() },
  { id: 'tag-reverb', name: 'Reverb', slug: 'reverb', createdAt: new Date().toISOString() },
  { id: 'tag-sample-packs', name: 'Sample Packs', slug: 'sample-packs', createdAt: new Date().toISOString() },
];

export const samplePosts: Post[] = [];

export const sampleMedia: Media[] = [];

// Create default user (no longer uses hashPassword - handled by server)
export async function createDefaultUser(): Promise<User> {
  return {
    id: generateId(),
    email: 'admin@blog.com',
    passwordHash: '', // Password is now handled server-side
    name: 'Admin',
    createdAt: new Date().toISOString(),
  };
}
