// SEO Data - Hub and Taxonomy Definitions

import { Hub, PillarPage, ProgrammaticTemplate, ResourcePage } from '@/types/seo';
import { generateId } from './storage';

// Default Hub Structures (Empty Shells)
export const defaultHubs: Omit<Hub, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Mixing',
    slug: 'mixing',
    parentHubId: null,
    seoTitle: '', // To be filled by site owner
    metaDescription: '', // To be filled by site owner
    description: '', // To be filled by site owner
    featuredImage: null,
    linkedPillars: [],
    sortOrder: 1,
    noIndex: false,
  },
  {
    name: 'Mastering',
    slug: 'mastering',
    parentHubId: null,
    seoTitle: '',
    metaDescription: '',
    description: '',
    featuredImage: null,
    linkedPillars: [],
    sortOrder: 2,
    noIndex: false,
  },
  {
    name: 'Music Production',
    slug: 'music-production',
    parentHubId: null,
    seoTitle: '',
    metaDescription: '',
    description: '',
    featuredImage: null,
    linkedPillars: [],
    sortOrder: 3,
    noIndex: false,
  },
  {
    name: 'Plugins & VST',
    slug: 'plugins-vst',
    parentHubId: null,
    seoTitle: '',
    metaDescription: '',
    description: '',
    featuredImage: null,
    linkedPillars: [],
    sortOrder: 4,
    noIndex: false,
  },
  {
    name: 'Gear Reviews',
    slug: 'gear-reviews',
    parentHubId: null,
    seoTitle: '',
    metaDescription: '',
    description: '',
    featuredImage: null,
    linkedPillars: [],
    sortOrder: 5,
    noIndex: false,
  },
  {
    name: 'Samples & Loops',
    slug: 'samples-loops',
    parentHubId: null,
    seoTitle: '',
    metaDescription: '',
    description: '',
    featuredImage: null,
    linkedPillars: [],
    sortOrder: 6,
    noIndex: false,
  },
  {
    name: 'Music Theory',
    slug: 'music-theory',
    parentHubId: null,
    seoTitle: '',
    metaDescription: '',
    description: '',
    featuredImage: null,
    linkedPillars: [],
    sortOrder: 7,
    noIndex: false,
  },
];

// Default Pillar Page Shells
export const defaultPillarPages: Omit<PillarPage, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Mixing & Mastering Guide',
    slug: 'mixing-mastering-guide',
    seoTitle: '', // To be filled by site owner
    metaDescription: '',
    content: '', // Empty - to be filled by site owner
    featuredImage: null,
    linkedHubs: [],
    linkedClusters: [],
    faqItems: [],
    comparisonTable: null,
    videoEmbeds: [],
    tocEnabled: true,
    noIndex: true, // noIndex until content is added
    authorId: null,
  },
  {
    title: 'Home Studio Setup Guide',
    slug: 'home-studio-setup-guide',
    seoTitle: '',
    metaDescription: '',
    content: '',
    featuredImage: null,
    linkedHubs: [],
    linkedClusters: [],
    faqItems: [],
    comparisonTable: null,
    videoEmbeds: [],
    tocEnabled: true,
    noIndex: true,
    authorId: null,
  },
  {
    title: 'Music Production for Beginners',
    slug: 'music-production-for-beginners',
    seoTitle: '',
    metaDescription: '',
    content: '',
    featuredImage: null,
    linkedHubs: [],
    linkedClusters: [],
    faqItems: [],
    comparisonTable: null,
    videoEmbeds: [],
    tocEnabled: true,
    noIndex: true,
    authorId: null,
  },
  {
    title: 'Ultimate Sample Packs Guide',
    slug: 'ultimate-sample-packs-guide',
    seoTitle: '',
    metaDescription: '',
    content: '',
    featuredImage: null,
    linkedHubs: [],
    linkedClusters: [],
    faqItems: [],
    comparisonTable: null,
    videoEmbeds: [],
    tocEnabled: true,
    noIndex: true,
    authorId: null,
  },
  {
    title: 'Music Gear Buying Guide',
    slug: 'music-gear-buying-guide',
    seoTitle: '',
    metaDescription: '',
    content: '',
    featuredImage: null,
    linkedHubs: [],
    linkedClusters: [],
    faqItems: [],
    comparisonTable: null,
    videoEmbeds: [],
    tocEnabled: true,
    noIndex: true,
    authorId: null,
  },
];

// Programmatic Page Templates
export const programmaticTemplates: Omit<ProgrammaticTemplate, 'id' | 'createdAt'>[] = [
  {
    templateName: 'Best EQ Settings',
    urlPattern: '/genre/{genre}/best-eq-settings',
    titlePattern: 'Best EQ Settings for {Genre}',
    metaDescriptionPattern: '', // To be filled by site owner
    linkedHub: 'mixing',
    linkedPillar: 'mixing-mastering-guide',
  },
  {
    templateName: 'Best Drum Kits',
    urlPattern: '/genre/{genre}/best-drum-kits',
    titlePattern: 'Best Drum Kits for {Genre}',
    metaDescriptionPattern: '',
    linkedHub: 'samples-loops',
    linkedPillar: 'ultimate-sample-packs-guide',
  },
  {
    templateName: 'Best BPM',
    urlPattern: '/genre/{genre}/best-bpm',
    titlePattern: 'Best BPM for {Genre}',
    metaDescriptionPattern: '',
    linkedHub: 'music-production',
    linkedPillar: 'music-production-for-beginners',
  },
  {
    templateName: 'Best Vocal Chain',
    urlPattern: '/genre/{genre}/best-vocal-chain',
    titlePattern: 'Best Vocal Chain for {Genre}',
    metaDescriptionPattern: '',
    linkedHub: 'mixing',
    linkedPillar: 'mixing-mastering-guide',
  },
  {
    templateName: 'Best Compression Settings',
    urlPattern: '/genre/{genre}/best-compression-settings',
    titlePattern: 'Best Compression Settings for {Genre}',
    metaDescriptionPattern: '',
    linkedHub: 'mixing',
    linkedPillar: 'mixing-mastering-guide',
  },
  {
    templateName: 'Best Reverb',
    urlPattern: '/genre/{genre}/best-reverb',
    titlePattern: 'Best Reverb for {Genre}',
    metaDescriptionPattern: '',
    linkedHub: 'mixing',
    linkedPillar: 'mixing-mastering-guide',
  },
  {
    templateName: 'Best Sample Packs',
    urlPattern: '/genre/{genre}/best-sample-packs',
    titlePattern: 'Best Sample Packs for {Genre}',
    metaDescriptionPattern: '',
    linkedHub: 'samples-loops',
    linkedPillar: 'ultimate-sample-packs-guide',
  },
];

// Default Resource Page Types
export const defaultResourceTypes: Omit<ResourcePage, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Free Sample Packs',
    slug: 'free-sample-packs',
    seoTitle: '',
    metaDescription: '',
    description: '',
    resourceType: 'sample-pack',
    downloadUrl: null,
    fileSize: null,
    thumbnailUrl: null,
    embedCode: null,
    noIndex: true, // Until populated
  },
  {
    title: 'Free Presets',
    slug: 'free-presets',
    seoTitle: '',
    metaDescription: '',
    description: '',
    resourceType: 'preset',
    downloadUrl: null,
    fileSize: null,
    thumbnailUrl: null,
    embedCode: null,
    noIndex: true,
  },
  {
    title: 'Cheat Sheets',
    slug: 'cheat-sheets',
    seoTitle: '',
    metaDescription: '',
    description: '',
    resourceType: 'cheatsheet',
    downloadUrl: null,
    fileSize: null,
    thumbnailUrl: null,
    embedCode: null,
    noIndex: true,
  },
  {
    title: 'DAW Templates',
    slug: 'daw-templates',
    seoTitle: '',
    metaDescription: '',
    description: '',
    resourceType: 'template',
    downloadUrl: null,
    fileSize: null,
    thumbnailUrl: null,
    embedCode: null,
    noIndex: true,
  },
  {
    title: 'Audio Tools',
    slug: 'audio-tools',
    seoTitle: '',
    metaDescription: '',
    description: '',
    resourceType: 'tool',
    downloadUrl: null,
    fileSize: null,
    thumbnailUrl: null,
    embedCode: null,
    noIndex: true,
  },
];

// Helper function to create hub with ID
export function createHub(hubData: Omit<Hub, 'id' | 'createdAt' | 'updatedAt'>): Hub {
  const now = new Date().toISOString();
  return {
    ...hubData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
}

// Helper function to create pillar page with ID
export function createPillarPage(pillarData: Omit<PillarPage, 'id' | 'createdAt' | 'updatedAt'>): PillarPage {
  const now = new Date().toISOString();
  return {
    ...pillarData,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
}

// Helper function to create programmatic template with ID
export function createProgrammaticTemplate(templateData: Omit<ProgrammaticTemplate, 'id' | 'createdAt'>): ProgrammaticTemplate {
  return {
    ...templateData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
}
