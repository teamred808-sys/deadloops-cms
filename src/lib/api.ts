// API Layer - Server-based storage with localStorage fallback 
import { Post, Category, Tag, Media, Settings, Stats, AuthState, AnalyticsSummary, DailyVisitorData, FooterPage } from '@/types/blog';
import { Author } from '@/types/seo';
import { get, post, put, del, setAuthToken, clearAuthToken, getAuthToken, uploadMedia, checkServerAvailability, isServerAvailable } from './apiClient';

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
  POSTS: 'blog_posts',
  CATEGORIES: 'blog_categories',
  TAGS: 'blog_tags',
  MEDIA: 'blog_media',
  SETTINGS: 'blog_settings',
  AUTHORS: 'blog_authors',
  USER_CREDENTIALS: 'blog_user_credentials',
};

// Local user type for fallback mode
interface LocalUser {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

const DEFAULT_LOCAL_USER: LocalUser = {
  id: 'local',
  email: 'admin@blog.com',
  password: 'admin123',
  name: 'Admin',
  createdAt: new Date().toISOString(),
};

// localStorage helpers
function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getLocalUser(): LocalUser {
  return getLocalStorage<LocalUser>(STORAGE_KEYS.USER_CREDENTIALS, DEFAULT_LOCAL_USER);
}

function setLocalUser(user: LocalUser): void {
  setLocalStorage(STORAGE_KEYS.USER_CREDENTIALS, user);
}

// Default settings for fallback
const defaultSettings: Settings = {
  siteTitle: 'Deadloops',
  tagline: 'Music Production Resources & Tutorials',
  logo: null,
  postsPerPage: 12,
  downloadTimerDuration: 15,
  adBlockerDetectionEnabled: false,
  adBlockerMessage: 'Please disable your ad blocker to access downloads.',
  googleAdsEnabled: false,
  googleAdsClientId: '',
  googleAdsDisplaySlotId: '',
  googleAdsInFeedSlotId: '',
  googleAdsInArticleSlotId: '',
  googleAdsMultiplexSlotId: '',
  googleAdsCode: '',
};

// Ensure default author exists in localStorage
function ensureDefaultAuthor(): void {
  const authors = getLocalStorage<Author[]>(STORAGE_KEYS.AUTHORS, []);
  if (authors.length === 0 || !authors.some(a => a.isDefault)) {
    const updatedAuthors = authors.length === 0 ? [defaultAuthor] : [...authors, defaultAuthor];
    setLocalStorage(STORAGE_KEYS.AUTHORS, updatedAuthors);
  }
}

// Initialize data - checks server connectivity
export async function initializeData(): Promise<void> {
  const available = await checkServerAvailability();
  if (!available) {
    console.warn('Server not available, using localStorage fallback mode');
    ensureDefaultAuthor();
  }
}

// ============= POSTS API =============
export async function getPosts(): Promise<Post[]> {
  if (isServerAvailable()) {
    try {
      return await get<Post[]>('/posts');
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  }
  return getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
}

export async function getPublishedPosts(): Promise<Post[]> {
  if (isServerAvailable()) {
    try {
      return await get<Post[]>('/posts/published');
    } catch (error) {
      console.error('Failed to fetch published posts:', error);
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  return posts.filter(p => p.status === 'published');
}

export async function getPost(id: string): Promise<Post | null> {
  if (isServerAvailable()) {
    try {
      return await get<Post>(`/posts/${id}`);
    } catch (error) {
      console.error('Failed to fetch post:', error);
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  return posts.find(p => p.id === id) || null;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (isServerAvailable()) {
    try {
      return await get<Post>(`/posts/slug/${slug}`);
    } catch (error) {
      console.error('Failed to fetch post by slug:', error);
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  return posts.find(p => p.slug === slug) || null;
}

export async function createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): Promise<Post> {
  if (isServerAvailable()) {
    return await post<Post>('/posts', postData);
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  const newPost: Post = {
    ...postData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    downloadCount: 0,
  };
  posts.push(newPost);
  setLocalStorage(STORAGE_KEYS.POSTS, posts);
  return newPost;
}

export async function updatePost(id: string, postData: Partial<Post>): Promise<Post | null> {
  if (isServerAvailable()) {
    try {
      return await put<Post>(`/posts/${id}`, postData);
    } catch (error) {
      console.error('Failed to update post:', error);
      return null;
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) return null;
  posts[index] = { ...posts[index], ...postData, updatedAt: new Date().toISOString() };
  setLocalStorage(STORAGE_KEYS.POSTS, posts);
  return posts[index];
}

export async function deletePost(id: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await del(`/posts/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete post:', error);
      return false;
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  const filtered = posts.filter(p => p.id !== id);
  setLocalStorage(STORAGE_KEYS.POSTS, filtered);
  return true;
}

export async function deletePosts(ids: string[]): Promise<number> {
  if (isServerAvailable()) {
    try {
      const result = await post<{ deletedCount: number }>('/posts/bulk-delete', { ids });
      return result.deletedCount;
    } catch (error) {
      console.error('Failed to bulk delete posts:', error);
      return 0;
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  const filtered = posts.filter(p => !ids.includes(p.id));
  setLocalStorage(STORAGE_KEYS.POSTS, filtered);
  return ids.length;
}

export async function duplicatePost(id: string): Promise<Post | null> {
  if (isServerAvailable()) {
    try {
      return await post<Post>(`/posts/${id}/duplicate`);
    } catch (error) {
      console.error('Failed to duplicate post:', error);
      return null;
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  const original = posts.find(p => p.id === id);
  if (!original) return null;
  const duplicate: Post = {
    ...original,
    id: crypto.randomUUID(),
    title: `${original.title} (Copy)`,
    slug: `${original.slug}-copy-${Date.now()}`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.push(duplicate);
  setLocalStorage(STORAGE_KEYS.POSTS, posts);
  return duplicate;
}

export async function incrementDownloadCount(id: string): Promise<void> {
  if (isServerAvailable()) {
    try {
      await post(`/posts/${id}/increment-download`);
      return;
    } catch (error) {
      console.error('Failed to increment download count:', error);
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  const index = posts.findIndex(p => p.id === id);
  if (index !== -1) {
    posts[index].downloadCount++;
    setLocalStorage(STORAGE_KEYS.POSTS, posts);
  }
}

// ============= CATEGORIES API =============
export async function getCategories(): Promise<Category[]> {
  if (isServerAvailable()) {
    try {
      return await get<Category[]>('/categories');
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }
  return getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
}

export async function getCategory(id: string): Promise<Category | null> {
  if (isServerAvailable()) {
    try {
      return await get<Category>(`/categories/${id}`);
    } catch (error) {
      console.error('Failed to fetch category:', error);
    }
  }
  const categories = getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  return categories.find(c => c.id === id) || null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find(cat => cat.slug === slug) || null;
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
  if (isServerAvailable()) {
    return await post<Category>('/categories', data);
  }
  const categories = getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  const newCategory: Category = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  categories.push(newCategory);
  setLocalStorage(STORAGE_KEYS.CATEGORIES, categories);
  return newCategory;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category | null> {
  if (isServerAvailable()) {
    try {
      return await put<Category>(`/categories/${id}`, data);
    } catch (error) {
      console.error('Failed to update category:', error);
      return null;
    }
  }
  const categories = getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return null;
  categories[index] = { ...categories[index], ...data };
  setLocalStorage(STORAGE_KEYS.CATEGORIES, categories);
  return categories[index];
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await del(`/categories/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete category:', error);
      return false;
    }
  }
  const categories = getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  const filtered = categories.filter(c => c.id !== id);
  setLocalStorage(STORAGE_KEYS.CATEGORIES, filtered);
  return true;
}

export async function getCategoryPostCount(categoryId: string): Promise<number> {
  if (isServerAvailable()) {
    try {
      const result = await get<{ count: number }>(`/categories/${categoryId}/post-count`);
      return result.count;
    } catch (error) {
      console.error('Failed to get category post count:', error);
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  return posts.filter(p => p.categories.includes(categoryId)).length;
}

// ============= TAGS API =============
export async function getTags(): Promise<Tag[]> {
  if (isServerAvailable()) {
    try {
      return await get<Tag[]>('/tags');
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }
  return getLocalStorage<Tag[]>(STORAGE_KEYS.TAGS, []);
}

export async function createTag(name: string): Promise<Tag> {
  if (isServerAvailable()) {
    return await post<Tag>('/tags', { name });
  }
  const tags = getLocalStorage<Tag[]>(STORAGE_KEYS.TAGS, []);
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const newTag: Tag = {
    id: crypto.randomUUID(),
    name,
    slug,
    createdAt: new Date().toISOString(),
  };
  tags.push(newTag);
  setLocalStorage(STORAGE_KEYS.TAGS, tags);
  return newTag;
}

export async function deleteTag(id: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await del(`/tags/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete tag:', error);
      return false;
    }
  }
  const tags = getLocalStorage<Tag[]>(STORAGE_KEYS.TAGS, []);
  const filtered = tags.filter(t => t.id !== id);
  setLocalStorage(STORAGE_KEYS.TAGS, filtered);
  return true;
}

// ============= MEDIA API =============
export async function getMedia(): Promise<Media[]> {
  if (isServerAvailable()) {
    try {
      return await get<Media[]>('/media');
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  }
  return getLocalStorage<Media[]>(STORAGE_KEYS.MEDIA, []);
}

export async function addMedia(file: File, width?: number, height?: number): Promise<Media> {
  if (isServerAvailable()) {
    return await uploadMedia(file, width, height);
  }
  // Fallback: store as base64 in localStorage
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const media = getLocalStorage<Media[]>(STORAGE_KEYS.MEDIA, []);
      const newMedia: Media = {
        id: crypto.randomUUID(),
        filename: file.name,
        url: reader.result as string,
        size: file.size,
        type: file.type,
        width,
        height,
        uploadedAt: new Date().toISOString(),
      };
      media.push(newMedia);
      setLocalStorage(STORAGE_KEYS.MEDIA, media);
      resolve(newMedia);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function deleteMedia(id: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await del(`/media/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete media:', error);
      return false;
    }
  }
  const media = getLocalStorage<Media[]>(STORAGE_KEYS.MEDIA, []);
  const filtered = media.filter(m => m.id !== id);
  setLocalStorage(STORAGE_KEYS.MEDIA, filtered);
  return true;
}

export async function deleteMediaByFilename(filename: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await del(`/media/${filename}`);
      return true;
    } catch (error) {
      console.error('Failed to delete media by filename:', error);
      return false;
    }
  }
  return false; // Not supported in local fallback yet
}

// ============= SETTINGS API =============
export async function getSettings(): Promise<Settings> {
  if (isServerAvailable()) {
    try {
      return await get<Settings>('/settings');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }
  return getLocalStorage<Settings>(STORAGE_KEYS.SETTINGS, defaultSettings);
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  if (isServerAvailable()) {
    try {
      return await put<Settings>('/settings', data);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }
  const settings = getLocalStorage<Settings>(STORAGE_KEYS.SETTINGS, defaultSettings);
  const updated = { ...settings, ...data };
  setLocalStorage(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// ============= AUTH API =============
export async function getAuthState(): Promise<AuthState> {
  const token = getAuthToken();
  if (!token) {
    return { isAuthenticated: false, user: null, token: null };
  }

  // For local dev token, return authenticated state using stored credentials
  if (token === 'local-dev-token') {
    const localUser = getLocalUser();
    return {
      isAuthenticated: true,
      user: { id: localUser.id, email: localUser.email, name: localUser.name, createdAt: localUser.createdAt },
      token,
    };
  }

  if (isServerAvailable()) {
    try {
      const result = await get<{ isAuthenticated: boolean; user: any }>('/auth/verify');
      return { ...result, token };
    } catch (error) {
      clearAuthToken();
      return { isAuthenticated: false, user: null, token: null };
    }
  }

  clearAuthToken();
  return { isAuthenticated: false, user: null, token: null };
}

export async function login(email: string, password: string, rememberMe: boolean = true): Promise<AuthState | null> {
  // Try server first if available
  if (isServerAvailable()) {
    try {
      const result = await post<AuthState>('/auth/login', { email, password, rememberMe });
      if (result.token) {
        setAuthToken(result.token, rememberMe);
      }
      return result;
    } catch (error) {
      console.error('Server login failed:', error);
    }
  }

  // Fallback to local credentials (stored or default)
  const localUser = getLocalUser();
  if (email === localUser.email && password === localUser.password) {
    const token = 'local-dev-token';
    setAuthToken(token, rememberMe);
    return {
      isAuthenticated: true,
      user: { id: localUser.id, email: localUser.email, name: localUser.name, createdAt: localUser.createdAt },
      token,
    };
  }

  return null;
}

export function logout(): void {
  clearAuthToken();
  if (isServerAvailable()) {
    post('/auth/logout').catch(() => { });
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await post('/auth/change-password', { currentPassword, newPassword });
      return true;
    } catch (error) {
      console.error('Failed to change password:', error);
      return false;
    }
  }
  // In fallback mode, password change is not supported
  console.warn('Password change not available in fallback mode');
  return false;
}

export async function changeEmail(newEmail: string, password: string): Promise<{ success: boolean; token?: string; user?: any }> {
  if (isServerAvailable()) {
    try {
      const result = await post<{ success: boolean; token: string; user: any }>('/auth/change-email', { newEmail, password });
      if (result.token) {
        setAuthToken(result.token, true);
      }
      return result;
    } catch (error) {
      console.error('Failed to change email:', error);
      throw error;
    }
  }

  // Fallback mode: verify password and update stored credentials
  const localUser = getLocalUser();
  if (password !== localUser.password) {
    throw new Error('Password is incorrect');
  }

  const updatedUser: LocalUser = {
    ...localUser,
    email: newEmail,
  };
  setLocalUser(updatedUser);

  return {
    success: true,
    user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, createdAt: updatedUser.createdAt },
  };
}

// ============= AUTHORS API =============
const defaultAuthor: Author = {
  id: 'default-author',
  name: 'Admin',
  slug: 'admin',
  bio: '',
  credentials: 'Site Administrator',
  image: null,
  socialLinks: {
    twitter: null,
    linkedin: null,
    github: null,
    website: null,
    youtube: null,
    instagram: null,
  },
  expertise: [],
  isActive: true,
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getAuthors(): Promise<Author[]> {
  if (isServerAvailable()) {
    try {
      return await get<Author[]>('/authors');
    } catch (error) {
      console.error('Failed to fetch authors:', error);
    }
  }
  const authors = getLocalStorage<Author[]>(STORAGE_KEYS.AUTHORS, [defaultAuthor]);
  return authors;
}

export async function getAuthor(id: string): Promise<Author | null> {
  if (isServerAvailable()) {
    try {
      return await get<Author>(`/authors/${id}`);
    } catch (error) {
      console.error('Failed to fetch author:', error);
    }
  }
  const authors = getLocalStorage<Author[]>(STORAGE_KEYS.AUTHORS, [defaultAuthor]);
  return authors.find(a => a.id === id) || null;
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  if (isServerAvailable()) {
    try {
      return await get<Author>(`/authors/slug/${slug}`);
    } catch (error) {
      console.error('Failed to fetch author by slug:', error);
    }
  }

  let authors = getLocalStorage<Author[]>(STORAGE_KEYS.AUTHORS, []);

  // Ensure default author exists if array is empty
  if (authors.length === 0) {
    authors = [defaultAuthor];
    setLocalStorage(STORAGE_KEYS.AUTHORS, authors);
  }

  const found = authors.find(a => a.slug === slug);

  // Fallback to default author for 'admin' slug if not found
  if (!found && slug === 'admin') {
    return defaultAuthor;
  }

  return found || null;
}

export async function createAuthor(authorData: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>): Promise<Author> {
  if (isServerAvailable()) {
    return await post<Author>('/authors', authorData);
  }
  const authors = getLocalStorage<Author[]>(STORAGE_KEYS.AUTHORS, [defaultAuthor]);
  const newAuthor: Author = {
    ...authorData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  authors.push(newAuthor);
  setLocalStorage(STORAGE_KEYS.AUTHORS, authors);
  return newAuthor;
}

export async function updateAuthor(id: string, authorData: Partial<Author>): Promise<Author | null> {
  if (isServerAvailable()) {
    try {
      return await put<Author>(`/authors/${id}`, authorData);
    } catch (error) {
      console.error('Failed to update author:', error);
      return null;
    }
  }
  const authors = getLocalStorage<Author[]>(STORAGE_KEYS.AUTHORS, [defaultAuthor]);
  const index = authors.findIndex(a => a.id === id);
  if (index === -1) return null;
  authors[index] = { ...authors[index], ...authorData, updatedAt: new Date().toISOString() };
  setLocalStorage(STORAGE_KEYS.AUTHORS, authors);
  return authors[index];
}

export async function deleteAuthor(id: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await del(`/authors/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete author:', error);
      return false;
    }
  }
  const authors = getLocalStorage<Author[]>(STORAGE_KEYS.AUTHORS, [defaultAuthor]);
  const filtered = authors.filter(a => a.id !== id);
  setLocalStorage(STORAGE_KEYS.AUTHORS, filtered);
  return true;
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  if (isServerAvailable()) {
    try {
      return await get<Post[]>(`/authors/${authorId}/posts`);
    } catch (error) {
      console.error('Failed to fetch posts by author:', error);
    }
  }
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  return posts
    .filter(p => p.authorId === authorId && p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

export async function getDefaultAuthor(): Promise<Author> {
  const authors = await getAuthors();
  return authors.find(a => a.isDefault) || defaultAuthor;
}

// ============= STATS API =============
export async function getStats(): Promise<Stats> {
  if (isServerAvailable()) {
    try {
      return await get<Stats>('/stats');
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  // Calculate stats from localStorage
  const posts = getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []);
  const media = getLocalStorage<Media[]>(STORAGE_KEYS.MEDIA, []);
  const categories = getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  const now = new Date();
  const thisMonth = posts.filter(p => {
    const postDate = new Date(p.createdAt);
    return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
  });

  return {
    totalPosts: posts.length,
    totalDownloads: posts.reduce((sum, p) => sum + (p.downloadCount || 0), 0),
    postsThisMonth: thisMonth.length,
    totalMedia: media.length,
    totalCategories: categories.length,
  };
}

// ============= ANALYTICS API =============
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  if (isServerAvailable()) {
    try {
      return await get<AnalyticsSummary>('/analytics/summary');
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
    }
  }

  // Return empty analytics in fallback mode
  return {
    visitors_today: 0,
    visitors_yesterday: 0,
    visitors_7d: 0,
    visitors_30d: 0,
    live_visitors: 0,
    last_updated: new Date().toISOString(),
  };
}

export async function getDailyAnalytics(days: number = 30): Promise<DailyVisitorData[]> {
  if (isServerAvailable()) {
    try {
      return await get<DailyVisitorData[]>(`/analytics/daily?days=${days}`);
    } catch (error) {
      console.error('Failed to fetch daily analytics:', error);
    }
  }

  // Return empty array in fallback mode
  return [];
}

// ============= STORAGE API =============
export async function getStorageUsage(): Promise<{ used: number; limit: number; percentage: number }> {
  if (isServerAvailable()) {
    try {
      return await get('/storage');
    } catch (error) {
      console.error('Failed to fetch storage usage:', error);
    }
  }

  // Calculate localStorage usage (approximate)
  let totalSize = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const item = localStorage.getItem(key);
    if (item) totalSize += item.length * 2; // UTF-16
  }
  const usedMB = totalSize / (1024 * 1024);
  const limitMB = 5; // localStorage limit ~5MB
  return { used: usedMB, limit: limitMB, percentage: (usedMB / limitMB) * 100 };
}

// ============= DATA EXPORT/IMPORT =============
export async function exportAllData(): Promise<string> {
  if (isServerAvailable()) {
    try {
      const data = await get('/export');
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }

  // Export from localStorage
  const data = {
    posts: getLocalStorage<Post[]>(STORAGE_KEYS.POSTS, []),
    categories: getLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []),
    tags: getLocalStorage<Tag[]>(STORAGE_KEYS.TAGS, []),
    media: getLocalStorage<Media[]>(STORAGE_KEYS.MEDIA, []),
    settings: getLocalStorage<Settings>(STORAGE_KEYS.SETTINGS, defaultSettings),
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      const data = JSON.parse(jsonString);
      await post('/import', data);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Import to localStorage
  try {
    const data = JSON.parse(jsonString);
    if (data.posts) setLocalStorage(STORAGE_KEYS.POSTS, data.posts);
    if (data.categories) setLocalStorage(STORAGE_KEYS.CATEGORIES, data.categories);
    if (data.tags) setLocalStorage(STORAGE_KEYS.TAGS, data.tags);
    if (data.media) setLocalStorage(STORAGE_KEYS.MEDIA, data.media);
    if (data.settings) setLocalStorage(STORAGE_KEYS.SETTINGS, data.settings);
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
}

export async function clearAllData(): Promise<void> {
  if (isServerAvailable()) {
    try {
      await post('/clear');
      return;
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // Clear localStorage
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}

// ============= FOOTER PAGES API =============
const FOOTER_PAGES_KEY = 'blog_footer_pages';

export async function getFooterPages(): Promise<FooterPage[]> {
  if (isServerAvailable()) {
    try {
      return await get<FooterPage[]>('/footer-pages');
    } catch (error) {
      console.error('Failed to fetch footer pages:', error);
    }
  }
  return getLocalStorage<FooterPage[]>(FOOTER_PAGES_KEY, []);
}

export async function getPublishedFooterPages(): Promise<FooterPage[]> {
  if (isServerAvailable()) {
    try {
      return await get<FooterPage[]>('/footer-pages/published');
    } catch (error) {
      console.error('Failed to fetch published footer pages:', error);
    }
  }
  const pages = getLocalStorage<FooterPage[]>(FOOTER_PAGES_KEY, []);
  return pages.filter(p => p.status === 'published');
}

export async function getFooterPage(id: string): Promise<FooterPage | null> {
  if (isServerAvailable()) {
    try {
      return await get<FooterPage>(`/footer-pages/${id}`);
    } catch (error) {
      console.error('Failed to fetch footer page:', error);
    }
  }
  const pages = getLocalStorage<FooterPage[]>(FOOTER_PAGES_KEY, []);
  return pages.find(p => p.id === id) || null;
}

export async function getFooterPageBySlug(slug: string): Promise<FooterPage | null> {
  if (isServerAvailable()) {
    try {
      return await get<FooterPage>(`/footer-pages/slug/${slug}`);
    } catch (error) {
      console.error('Failed to fetch footer page by slug:', error);
    }
  }
  const pages = getLocalStorage<FooterPage[]>(FOOTER_PAGES_KEY, []);
  return pages.find(p => p.slug === slug) || null;
}

export async function createFooterPage(pageData: Omit<FooterPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<FooterPage> {
  if (isServerAvailable()) {
    return await post<FooterPage>('/footer-pages', pageData);
  }
  const pages = getLocalStorage<FooterPage[]>(FOOTER_PAGES_KEY, []);
  const newPage: FooterPage = {
    ...pageData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  pages.push(newPage);
  setLocalStorage(FOOTER_PAGES_KEY, pages);
  return newPage;
}

export async function updateFooterPage(id: string, pageData: Partial<FooterPage>): Promise<FooterPage | null> {
  if (isServerAvailable()) {
    try {
      return await put<FooterPage>(`/footer-pages/${id}`, pageData);
    } catch (error) {
      console.error('Failed to update footer page:', error);
      return null;
    }
  }
  const pages = getLocalStorage<FooterPage[]>(FOOTER_PAGES_KEY, []);
  const index = pages.findIndex(p => p.id === id);
  if (index === -1) return null;
  pages[index] = { ...pages[index], ...pageData, updatedAt: new Date().toISOString() };
  setLocalStorage(FOOTER_PAGES_KEY, pages);
  return pages[index];
}

export async function updateFooterPagesOrder(orderedIds: string[]): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await put('/footer-pages/reorder', { ids: orderedIds });
      return true;
    } catch (error) {
      console.error('Failed to update footer pages order:', error);
      return false;
    }
  }
  const pages = getLocalStorage<FooterPage[]>(FOOTER_PAGES_KEY, []);
  const reorderedPages = orderedIds.map((id, index) => {
    const page = pages.find(p => p.id === id);
    if (page) {
      return { ...page, sortOrder: index };
    }
    return null;
  }).filter((p): p is FooterPage => p !== null);
  setLocalStorage(FOOTER_PAGES_KEY, reorderedPages);
  return true;
}

export async function deleteFooterPage(id: string): Promise<boolean> {
  if (isServerAvailable()) {
    try {
      await del(`/footer-pages/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete footer page:', error);
      return false;
    }
  }
  const pages = getLocalStorage<FooterPage[]>(FOOTER_PAGES_KEY, []);
  const filtered = pages.filter(p => p.id !== id);
  setLocalStorage(FOOTER_PAGES_KEY, filtered);
  return true;
}
