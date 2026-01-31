import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  ensureDirectories,
  readJsonFile,
  writeJsonFile,
  getStorageUsage,
  getUploadsPath,
  deleteUploadedFile,
  generateId,
  generateSlug,
} from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============= GLOBAL ERROR HANDLERS FOR HOSTINGER STABILITY =============
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ============= CRITICAL: STARTUP LOGGING FOR HOSTINGER =============
console.log('🚀 Server starting...');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ============= GUARANTEED HEALTH ENDPOINTS (BEFORE ANY MIDDLEWARE) =============
app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============= ENSURE REQUIRED DIRECTORIES EXIST =============
const requiredDirs = [
  path.resolve(__dirname, 'data'),
  path.resolve(__dirname, 'uploads'),
];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('📁 Created missing dir:', dir);
  }
}

// Ensure directories exist (from storage.js)
ensureDirectories();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(getUploadsPath()));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadsPath());
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

// Default settings
const defaultSettings = {
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

// Initialize default admin user if not exists
async function initializeDefaultUser() {
  const users = readJsonFile('users.json', []);
  if (users.length === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const defaultUser = {
      id: generateId(),
      email: 'admin@blog.com',
      passwordHash,
      name: 'Admin',
      createdAt: new Date().toISOString(),
    };
    writeJsonFile('users.json', [defaultUser]);
    console.log('Default admin user created: admin@blog.com / admin123');
  }
}

// Initialize default author if not exists
function initializeDefaultAuthor() {
  const authors = readJsonFile('authors.json', []);
  if (authors.length === 0) {
    const defaultAuthor = {
      id: generateId(),
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
    writeJsonFile('authors.json', [defaultAuthor]);
    console.log('Default author created');
  }
}

// Initialize settings if not exists
function initializeSettings() {
  const settings = readJsonFile('settings.json', null);
  if (!settings) {
    writeJsonFile('settings.json', defaultSettings);
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ============= POSTS API =============
app.get('/api/posts', (req, res) => {
  const posts = readJsonFile('posts.json', []);
  res.json(posts);
});

app.get('/api/posts/published', (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const published = posts
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  res.json(published);
});

app.get('/api/posts/:id', (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

app.get('/api/posts/slug/:slug', (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const post = posts.find(p => p.slug === req.params.slug && p.status === 'published');
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

app.post('/api/posts', authenticateToken, (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const newPost = {
    ...req.body,
    id: generateId(),
    slug: req.body.slug || generateSlug(req.body.title),
    downloadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.push(newPost);
  writeJsonFile('posts.json', posts);
  res.status(201).json(newPost);
});

app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  posts[index] = {
    ...posts[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile('posts.json', posts);
  res.json(posts[index]);
});

app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const filtered = posts.filter(p => p.id !== req.params.id);
  if (filtered.length === posts.length) {
    return res.status(404).json({ error: 'Post not found' });
  }
  writeJsonFile('posts.json', filtered);
  res.json({ success: true });
});

app.post('/api/posts/bulk-delete', authenticateToken, (req, res) => {
  const { ids } = req.body;
  const posts = readJsonFile('posts.json', []);
  const filtered = posts.filter(p => !ids.includes(p.id));
  const deletedCount = posts.length - filtered.length;
  writeJsonFile('posts.json', filtered);
  res.json({ deletedCount });
});

app.post('/api/posts/:id/duplicate', authenticateToken, (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const newPost = {
    ...post,
    id: generateId(),
    title: `${post.title} (Copy)`,
    slug: generateSlug(`${post.title} copy`),
    status: 'draft',
    downloadCount: 0,
    publishDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.push(newPost);
  writeJsonFile('posts.json', posts);
  res.status(201).json(newPost);
});

app.post('/api/posts/:id/increment-download', (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    posts[index].downloadCount += 1;
    writeJsonFile('posts.json', posts);
    res.json({ downloadCount: posts[index].downloadCount });
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

// ============= FOOTER PAGES API =============
app.get('/api/footer-pages', (req, res) => {
  const pages = readJsonFile('footer_pages.json', []);
  res.json(pages);
});

app.get('/api/footer-pages/published', (req, res) => {
  const pages = readJsonFile('footer_pages.json', []);
  const published = pages
    .filter(p => p.status === 'published')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  res.json(published);
});

app.get('/api/footer-pages/:id', (req, res) => {
  const pages = readJsonFile('footer_pages.json', []);
  const page = pages.find(p => p.id === req.params.id);
  if (!page) {
    return res.status(404).json({ error: 'Footer page not found' });
  }
  res.json(page);
});

app.get('/api/footer-pages/slug/:slug', (req, res) => {
  const pages = readJsonFile('footer_pages.json', []);
  const page = pages.find(p => p.slug === req.params.slug);
  if (!page) {
    return res.status(404).json({ error: 'Footer page not found' });
  }
  res.json(page);
});

app.post('/api/footer-pages', authenticateToken, (req, res) => {
  const pages = readJsonFile('footer_pages.json', []);
  const newPage = {
    ...req.body,
    id: generateId(),
    slug: req.body.slug || generateSlug(req.body.title),
    sortOrder: req.body.sortOrder ?? pages.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  pages.push(newPage);
  writeJsonFile('footer_pages.json', pages);
  res.status(201).json(newPage);
});

app.put('/api/footer-pages/reorder', authenticateToken, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid ids array' });
  }
  const pages = readJsonFile('footer_pages.json', []);
  const reorderedPages = ids.map((id, index) => {
    const page = pages.find(p => p.id === id);
    if (page) {
      return { ...page, sortOrder: index, updatedAt: new Date().toISOString() };
    }
    return null;
  }).filter(p => p !== null);
  writeJsonFile('footer_pages.json', reorderedPages);
  res.json({ success: true });
});

app.put('/api/footer-pages/:id', authenticateToken, (req, res) => {
  const pages = readJsonFile('footer_pages.json', []);
  const index = pages.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Footer page not found' });
  }
  pages[index] = {
    ...pages[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile('footer_pages.json', pages);
  res.json(pages[index]);
});

app.delete('/api/footer-pages/:id', authenticateToken, (req, res) => {
  const pages = readJsonFile('footer_pages.json', []);
  const filtered = pages.filter(p => p.id !== req.params.id);
  if (filtered.length === pages.length) {
    return res.status(404).json({ error: 'Footer page not found' });
  }
  writeJsonFile('footer_pages.json', filtered);
  res.json({ success: true });
});

// ============= CATEGORIES API =============
app.get('/api/categories', (req, res) => {
  const categories = readJsonFile('categories.json', []);
  res.json(categories);
});

app.get('/api/categories/:id', (req, res) => {
  const categories = readJsonFile('categories.json', []);
  const category = categories.find(c => c.id === req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json(category);
});

app.post('/api/categories', authenticateToken, (req, res) => {
  const categories = readJsonFile('categories.json', []);
  const newCategory = {
    ...req.body,
    id: generateId(),
    slug: req.body.slug || generateSlug(req.body.name),
    createdAt: new Date().toISOString(),
  };
  categories.push(newCategory);
  writeJsonFile('categories.json', categories);
  res.status(201).json(newCategory);
});

app.put('/api/categories/:id', authenticateToken, (req, res) => {
  const categories = readJsonFile('categories.json', []);
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  categories[index] = { ...categories[index], ...req.body };
  writeJsonFile('categories.json', categories);
  res.json(categories[index]);
});

app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  const categories = readJsonFile('categories.json', []);
  const filtered = categories.filter(c => c.id !== req.params.id);
  if (filtered.length === categories.length) {
    return res.status(404).json({ error: 'Category not found' });
  }
  writeJsonFile('categories.json', filtered);
  res.json({ success: true });
});

app.get('/api/categories/:id/post-count', (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const count = posts.filter(p => p.categories.includes(req.params.id)).length;
  res.json({ count });
});

// ============= TAGS API =============
app.get('/api/tags', (req, res) => {
  const tags = readJsonFile('tags.json', []);
  res.json(tags);
});

app.post('/api/tags', authenticateToken, (req, res) => {
  const tags = readJsonFile('tags.json', []);
  const newTag = {
    id: generateId(),
    name: req.body.name,
    slug: generateSlug(req.body.name),
    createdAt: new Date().toISOString(),
  };
  tags.push(newTag);
  writeJsonFile('tags.json', tags);
  res.status(201).json(newTag);
});

app.delete('/api/tags/:id', authenticateToken, (req, res) => {
  const tags = readJsonFile('tags.json', []);
  const filtered = tags.filter(t => t.id !== req.params.id);
  if (filtered.length === tags.length) {
    return res.status(404).json({ error: 'Tag not found' });
  }
  writeJsonFile('tags.json', filtered);
  res.json({ success: true });
});

// ============= MEDIA API =============
app.get('/api/media', (req, res) => {
  const media = readJsonFile('media.json', []);
  res.json(media);
});

app.post('/api/media', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const media = readJsonFile('media.json', []);
  const newMedia = {
    id: generateId(),
    filename: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    size: req.file.size,
    type: req.file.mimetype,
    width: req.body.width ? parseInt(req.body.width) : undefined,
    height: req.body.height ? parseInt(req.body.height) : undefined,
    uploadedAt: new Date().toISOString(),
  };
  media.push(newMedia);
  writeJsonFile('media.json', media);
  res.status(201).json(newMedia);
});

app.delete('/api/media/:id', authenticateToken, (req, res) => {
  const media = readJsonFile('media.json', []);
  const item = media.find(m => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Media not found' });
  }

  // Delete file from disk
  const filename = item.url.replace('/uploads/', '');
  deleteUploadedFile(filename);

  // Remove from database
  const filtered = media.filter(m => m.id !== req.params.id);
  writeJsonFile('media.json', filtered);
  res.json({ success: true });
});

// ============= SETTINGS API =============
app.get('/api/settings', (req, res) => {
  const settings = readJsonFile('settings.json', defaultSettings);
  res.json(settings);
});

app.put('/api/settings', authenticateToken, (req, res) => {
  const settings = readJsonFile('settings.json', defaultSettings);
  const updated = { ...settings, ...req.body };
  writeJsonFile('settings.json', updated);
  res.json(updated);
});

// ============= AUTH API =============
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readJsonFile('users.json', []);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    isAuthenticated: true,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    token,
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const users = readJsonFile('users.json', []);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isValid = await bcrypt.compare(currentPassword, users[userIndex].passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  users[userIndex].passwordHash = await bcrypt.hash(newPassword, 10);
  writeJsonFile('users.json', users);
  res.json({ success: true });
});

// Change email endpoint
app.post('/api/auth/change-email', authenticateToken, async (req, res) => {
  const { newEmail, password } = req.body;
  const userId = req.user.id;

  const users = readJsonFile('users.json', []);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify password before allowing email change
  const isValid = await bcrypt.compare(password, users[userIndex].passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Password is incorrect' });
  }

  // Check if email is already taken
  const emailExists = users.some(u => u.email === newEmail && u.id !== userId);
  if (emailExists) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  users[userIndex].email = newEmail;
  writeJsonFile('users.json', users);

  // Return new token with updated email
  const token = jwt.sign({ id: userId, email: newEmail }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    token,
    user: { id: users[userIndex].id, email: newEmail, name: users[userIndex].name }
  });
});

// ============= AUTHORS API =============
app.get('/api/authors', (req, res) => {
  const authors = readJsonFile('authors.json', []);
  const activeOnly = req.query.active === 'true';
  res.json(activeOnly ? authors.filter(a => a.isActive) : authors);
});

app.get('/api/authors/:id', (req, res) => {
  const authors = readJsonFile('authors.json', []);
  const author = authors.find(a => a.id === req.params.id);
  if (!author) {
    return res.status(404).json({ error: 'Author not found' });
  }
  res.json(author);
});

app.get('/api/authors/slug/:slug', (req, res) => {
  const authors = readJsonFile('authors.json', []);
  const author = authors.find(a => a.slug === req.params.slug);
  if (!author) {
    return res.status(404).json({ error: 'Author not found' });
  }
  res.json(author);
});

app.get('/api/authors/:id/posts', (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const authorPosts = posts
    .filter(p => p.authorId === req.params.id && p.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  res.json(authorPosts);
});

app.post('/api/authors', authenticateToken, (req, res) => {
  const authors = readJsonFile('authors.json', []);
  const newAuthor = {
    ...req.body,
    id: generateId(),
    slug: req.body.slug || generateSlug(req.body.name),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  authors.push(newAuthor);
  writeJsonFile('authors.json', authors);
  res.status(201).json(newAuthor);
});

app.put('/api/authors/:id', authenticateToken, (req, res) => {
  const authors = readJsonFile('authors.json', []);
  const index = authors.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Author not found' });
  }
  authors[index] = {
    ...authors[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile('authors.json', authors);
  res.json(authors[index]);
});

app.delete('/api/authors/:id', authenticateToken, (req, res) => {
  const authors = readJsonFile('authors.json', []);
  const author = authors.find(a => a.id === req.params.id);
  if (!author) {
    return res.status(404).json({ error: 'Author not found' });
  }
  if (author.isDefault) {
    return res.status(400).json({ error: 'Cannot delete default author' });
  }
  const filtered = authors.filter(a => a.id !== req.params.id);
  writeJsonFile('authors.json', filtered);
  res.json({ success: true });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const users = readJsonFile('users.json', []);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    isAuthenticated: true,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
});

// ============= VISITOR TRACKING API =============
function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function cleanupStaleSessions() {
  const sessions = readJsonFile('live_sessions.json', []);
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const activeSessions = sessions.filter(s => s.last_active_at >= tenMinutesAgo);
  if (activeSessions.length !== sessions.length) {
    writeJsonFile('live_sessions.json', activeSessions);
  }
}

// POST /api/track - Receive visitor pings (no auth required)
app.post('/api/track', (req, res) => {
  try {
    const { session_id, page_url, timestamp } = req.body;
    if (!session_id || !page_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userAgent = req.headers['user-agent'] || '';
    const deviceType = getDeviceType(userAgent);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Update daily visitors
    const dailyVisitors = readJsonFile('daily_visitors.json', []);
    let todayRecord = dailyVisitors.find(d => d.date === today);

    if (!todayRecord) {
      todayRecord = {
        date: today,
        unique_visitors: 0,
        total_pageviews: 0,
        sessions: [],
        last_updated: new Date().toISOString(),
      };
      dailyVisitors.push(todayRecord);
    }

    // Check if this is a new unique visitor for today
    if (!todayRecord.sessions.includes(session_id)) {
      todayRecord.sessions.push(session_id);
      todayRecord.unique_visitors++;
    }

    // Always increment pageviews
    todayRecord.total_pageviews++;
    todayRecord.last_updated = new Date().toISOString();

    writeJsonFile('daily_visitors.json', dailyVisitors);

    // Update live sessions
    const liveSessions = readJsonFile('live_sessions.json', []);
    const existingIndex = liveSessions.findIndex(s => s.session_id === session_id);
    const sessionData = {
      session_id,
      last_active_at: new Date().toISOString(),
      current_page: page_url,
      device_type: deviceType,
    };

    if (existingIndex >= 0) {
      liveSessions[existingIndex] = sessionData;
    } else {
      liveSessions.push(sessionData);
    }

    writeJsonFile('live_sessions.json', liveSessions);

    // Cleanup stale sessions periodically
    cleanupStaleSessions();

    res.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    res.json({ success: true }); // Always return success to not block client
  }
});

// GET /api/analytics/summary - Get visitor stats (admin only)
app.get('/api/analytics/summary', authenticateToken, (req, res) => {
  const dailyVisitors = readJsonFile('daily_visitors.json', []);
  const liveSessions = readJsonFile('live_sessions.json', []);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Calculate date ranges
  const last7Days = [];
  const last30Days = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last30Days.push(dateStr);
    if (i < 7) last7Days.push(dateStr);
  }

  // Sum visitors
  const visitors_today = dailyVisitors.find(d => d.date === todayStr)?.unique_visitors || 0;
  const visitors_yesterday = dailyVisitors.find(d => d.date === yesterdayStr)?.unique_visitors || 0;

  const visitors_7d = dailyVisitors
    .filter(d => last7Days.includes(d.date))
    .reduce((sum, d) => sum + d.unique_visitors, 0);

  const visitors_30d = dailyVisitors
    .filter(d => last30Days.includes(d.date))
    .reduce((sum, d) => sum + d.unique_visitors, 0);

  // Count live visitors (active in last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const live_visitors = liveSessions.filter(s => s.last_active_at >= fiveMinutesAgo).length;

  res.json({
    visitors_today,
    visitors_yesterday,
    visitors_7d,
    visitors_30d,
    live_visitors,
    last_updated: new Date().toISOString(),
  });
});

// GET /api/analytics/daily - Get daily visitor history (admin only)
app.get('/api/analytics/daily', authenticateToken, (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const dailyVisitors = readJsonFile('daily_visitors.json', []);

  // Generate date range
  const today = new Date();
  const dateRange = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dateRange.push(d.toISOString().split('T')[0]);
  }

  // Map to result with zeros for missing days
  const result = dateRange.map(date => {
    const record = dailyVisitors.find(d => d.date === date);
    return {
      date,
      unique_visitors: record?.unique_visitors || 0,
      total_pageviews: record?.total_pageviews || 0,
    };
  });

  res.json(result);
});

// ============= STATS API =============
app.get('/api/stats', (req, res) => {
  const posts = readJsonFile('posts.json', []);
  const media = readJsonFile('media.json', []);
  const categories = readJsonFile('categories.json', []);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const postsThisMonth = posts.filter(
    post => new Date(post.createdAt) >= startOfMonth
  ).length;

  const totalDownloads = posts.reduce((sum, post) => sum + post.downloadCount, 0);

  res.json({
    totalPosts: posts.length,
    totalDownloads,
    postsThisMonth,
    totalMedia: media.length,
    totalCategories: categories.length,
  });
});

// ============= STORAGE API =============
app.get('/api/storage', (req, res) => {
  const usage = getStorageUsage();
  res.json(usage);
});

// ============= DATA EXPORT/IMPORT =============
app.get('/api/export', authenticateToken, (req, res) => {
  const data = {
    posts: readJsonFile('posts.json', []),
    categories: readJsonFile('categories.json', []),
    tags: readJsonFile('tags.json', []),
    media: readJsonFile('media.json', []),
    settings: readJsonFile('settings.json', defaultSettings),
    exportedAt: new Date().toISOString(),
  };
  res.json(data);
});

app.post('/api/import', authenticateToken, (req, res) => {
  try {
    const { posts, categories, tags, media, settings } = req.body;
    if (posts) writeJsonFile('posts.json', posts);
    if (categories) writeJsonFile('categories.json', categories);
    if (tags) writeJsonFile('tags.json', tags);
    if (media) writeJsonFile('media.json', media);
    if (settings) writeJsonFile('settings.json', settings);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid import data' });
  }
});

app.post('/api/clear', authenticateToken, (req, res) => {
  writeJsonFile('posts.json', []);
  writeJsonFile('categories.json', []);
  writeJsonFile('tags.json', []);
  writeJsonFile('media.json', []);
  writeJsonFile('settings.json', defaultSettings);
  res.json({ success: true });
});

// ============= FILE UPLOAD API =============
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    filename: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    size: req.file.size,
    type: req.file.mimetype,
  });
});

// ============= HARDENED STATIC FRONTEND SERVING =============
const frontendPath = path.resolve(__dirname, '..', 'dist');
console.log('Resolved frontendPath:', frontendPath);
console.log('Frontend exists:', fs.existsSync(frontendPath));

if (fs.existsSync(frontendPath)) {
  console.log('📦 Serving frontend from:', frontendPath);
  app.use(express.static(frontendPath));

  // Handle client-side routing - serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      next();
    }
  });
} else {
  console.error('❌ dist folder NOT FOUND at:', frontendPath);
}

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize and start server with error handling
async function start() {
  try {
    await initializeDefaultUser();
    initializeSettings();
    initializeDefaultAuthor();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
      console.log(`📁 Data directory: ${path.resolve(__dirname, 'data')}`);
      console.log(`📸 Uploads directory: ${getUploadsPath()}`);
      if (fs.existsSync(frontendPath)) {
        console.log(`🌐 Frontend: ${frontendPath}`);
      }
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
}

// Add global error handling for promises that might fail during import/init
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR: Uncaught Exception:', err);
  // Keep the process alive long enough to flush logs if possible, but we must exit
  process.exit(1);
});

start();
