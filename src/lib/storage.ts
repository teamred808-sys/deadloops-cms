// Storage utility functions (server-side storage now handled by API)

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID();
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Get excerpt from content
export function getExcerpt(content: string, maxLength: number = 150): string {
  const plainText = content.replace(/<[^>]+>/g, '');
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength).trim() + '...';
}

// Storage keys (kept for backward compatibility during migration)
export const STORAGE_KEYS = {
  POSTS: 'blog_posts',
  CATEGORIES: 'blog_categories',
  TAGS: 'blog_tags',
  MEDIA: 'blog_media',
  SETTINGS: 'blog_settings',
  AUTH: 'blog_auth',
  USERS: 'blog_users',
  INITIALIZED: 'blog_initialized',
  DATA_VERSION: 'blog_data_version',
  AUTHORS: 'blog_authors',
  HUBS: 'blog_hubs',
  PILLARS: 'blog_pillars',
  PROGRAMMATIC: 'blog_programmatic',
  RESOURCES: 'blog_resources',
  SEO_SETTINGS: 'blog_seo_settings',
} as const;

// Legacy localStorage helpers (for migration purposes only)
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}
