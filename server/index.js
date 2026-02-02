const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const {
  getUploadsPath,
  deleteUploadedFile,
  generateId,
  generateSlug,
  getExcerpt,
} = require('./storage.js');
const { pool } = require('./db');

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

// ============= SAFE STARTUP: DIRECTORY CONFIGURATION =============
// 1. Determine Upload Directory
// STRICT: Use env var or fall back to SPECIFIC Hostinger path, or local fallback
let UPLOAD_DIR = process.env.UPLOAD_DIR || '/home/u837896566/uploads';

// Local Fallback: If Hostinger path is not accessible/creatable (e.g. on Mac), use local folder
try {
  // Check if we can write to the preferred path or if it exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    // Try creating it (will fail if permissions/path parent missing on local)
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  // Test write permission
  fs.accessSync(UPLOAD_DIR, fs.constants.W_OK);
} catch (error) {
  console.warn(`⚠️ Cannot use persistent path ${UPLOAD_DIR} (Local Dev Environment?).`);
  // Fallback to local 'uploads'
  UPLOAD_DIR = path.join(__dirname, 'uploads');
  console.log(`⚠️ Falling back to local directory: ${UPLOAD_DIR}`);
}

const DATA_DIR = process.env.PERSISTENT_STORAGE_PATH
  ? path.resolve(process.env.PERSISTENT_STORAGE_PATH, 'data')
  : path.resolve('data');

console.log(`📂 Configuration:`);
console.log(`   - Uploads: ${UPLOAD_DIR}`);
console.log(`   - Data: ${DATA_DIR}`);

// 2. Ensure Directories Exist (Safe Mode)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('✅ Created upload directory');
  }
} catch (error) {
  console.error('⚠️ Failed to create directories (permissions?):', error.message);
  console.error('   Server will continue, but uploads might fail.');
}

// 3. Middleware & Serving
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============= HEALTH CHECKS =============
app.get('/ping', (req, res) => res.send('pong'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Diagnostic endpoint to check upload configuration AND database schema
app.get('/api/debug/config', async (req, res) => {
  const files = fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR) : [];
  let settingsColumns = [];
  try {
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'settings'
    `);
    settingsColumns = cols.map(c => c.COLUMN_NAME);
  } catch (e) {
    settingsColumns = ['Error fetching columns: ' + e.message];
  }

  res.json({
    uploadDir: UPLOAD_DIR,
    dataDir: DATA_DIR,
    uploadDirExists: fs.existsSync(UPLOAD_DIR),
    uploadDirWritable: (() => { try { fs.accessSync(UPLOAD_DIR, fs.constants.W_OK); return true; } catch { return false; } })(),
    filesInUploadDir: files.length,
    sampleFiles: files.slice(0, 5),
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV || 'not set',
    settingsTableColumns: settingsColumns
  });
});

// 🛑 CRITICAL: Serve files from the SAFE configured path
// Serve /media for new standard, /uploads for backward compatibility
app.use('/media', express.static(UPLOAD_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use the safe UPLOAD_DIR resolved at startup
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // User requested format: Date.now() + "-" + file.originalname
    const uniqueName = Date.now() + "-" + file.originalname;
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

// ... (skipping unchanged code) ...

// ============= FILE UPLOAD API =============
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // The file is already saved to the persistent path by Multer (configured via storage.js -> getUploadsPath)
  // We just return the URL relative to the domain (served via express.static)
  console.log(`✅ File saved to: ${req.file.path}`);

  // User requested URL format: /uploads/filename
  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    filename: req.file.filename,
    url: fileUrl,
    size: req.file.size,
    type: req.file.mimetype,
  });
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
// Initialize default admin user if not exists
async function initializeDefaultUser() {
  try {
    const [users] = await pool.query('SELECT * FROM users LIMIT 1');
    if (users.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const defaultUser = {
        id: generateId(),
        email: 'admin@blog.com',
        passwordHash,
        name: 'Admin',
        createdAt: new Date().toISOString(),
      };
      await pool.query(
        'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)',
        [defaultUser.id, defaultUser.email, defaultUser.passwordHash, defaultUser.name, defaultUser.createdAt]
      );
      console.log('Default admin user created: admin@blog.com / admin123');
    }
  } catch (error) {
    console.error('Failed to initialize default user:', error);
  }
}

// Initialize default author if not exists
// Initialize default author if not exists
async function initializeDefaultAuthor() {
  try {
    const [authors] = await pool.query('SELECT * FROM authors WHERE is_default = TRUE LIMIT 1');
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
      await pool.query(
        `INSERT INTO authors 
        (id, name, slug, bio, credentials, image, social_links, expertise, is_active, is_default, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          defaultAuthor.id, defaultAuthor.name, defaultAuthor.slug, defaultAuthor.bio, defaultAuthor.credentials,
          defaultAuthor.image, JSON.stringify(defaultAuthor.socialLinks), JSON.stringify(defaultAuthor.expertise),
          defaultAuthor.isActive, defaultAuthor.isDefault, defaultAuthor.createdAt, defaultAuthor.updatedAt
        ]
      );
      console.log('Default author created');
    }
  } catch (error) {
    console.error('Failed to initialize default author:', error);
  }
}

// Initialize settings if not exists
// Initialize settings if not exists
async function initializeSettings() {
  try {
    const [settings] = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (settings.length === 0) {
      const googleAdsConfig = {
        displaySlotId: defaultSettings.googleAdsDisplaySlotId,
        inFeedSlotId: defaultSettings.googleAdsInFeedSlotId,
        inArticleSlotId: defaultSettings.googleAdsInArticleSlotId,
        multiplexSlotId: defaultSettings.googleAdsMultiplexSlotId
      };

      await pool.query(
        `INSERT INTO settings 
        (id, site_title, tagline, logo, posts_per_page, download_timer_duration, 
         ad_blocker_detection_enabled, ad_blocker_message, google_ads_enabled, 
         google_ads_client_id, google_ads_code, google_ads_config) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          defaultSettings.siteTitle, defaultSettings.tagline, defaultSettings.logo, defaultSettings.postsPerPage,
          defaultSettings.downloadTimerDuration, defaultSettings.adBlockerDetectionEnabled, defaultSettings.adBlockerMessage,
          defaultSettings.googleAdsEnabled, defaultSettings.googleAdsClientId, defaultSettings.googleAdsCode,
          JSON.stringify(googleAdsConfig)
        ]
      );
    }
  } catch (error) {
    console.error('Failed to initialize settings:', error);
  }
}

// ============= SCHEMA MIGRATION (AUTO-HEAL) =============
async function ensureSchemaUpdates() {
  try {
    console.log('🔄 Checking database schema...');

    // Check if 'download_enabled' exists in 'posts'
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'posts' 
      AND COLUMN_NAME = 'download_enabled'
    `);

    if (columns.length === 0) {
      console.log('⚠️ Missing download columns in posts table. Adding them...');
      await pool.query(`
        ALTER TABLE posts 
        ADD COLUMN download_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN download_url TEXT,
        ADD COLUMN download_filename VARCHAR(255),
        ADD COLUMN download_size VARCHAR(50)
      `);
      console.log('✅ Schema updated: Added download columns to posts.');
    }

    // Check if 'google_ads_enabled' exists in 'settings'
    const [settingsColumns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'settings' 
      AND COLUMN_NAME = 'google_ads_enabled'
    `);

    if (settingsColumns.length === 0) {
      console.log('⚠️ Missing Google Ads columns in settings table. Adding them...');
      await pool.query(`
        ALTER TABLE settings 
        ADD COLUMN google_ads_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN google_ads_client_id VARCHAR(255),
        ADD COLUMN google_ads_code TEXT,
        ADD COLUMN google_ads_config JSON
      `);
      console.log('✅ Schema updated: Added Google Ads columns to settings.');
    } else {
      console.log('✅ Schema is up to date.');
    }

    // Check if 'sessions' exists in 'daily_visitors'
    const [visitorColumns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'daily_visitors' 
      AND COLUMN_NAME = 'sessions'
    `);

    if (visitorColumns.length === 0) {
      console.log('⚠️ Missing sessions column in daily_visitors table. Adding it...');
      await pool.query(`
        ALTER TABLE daily_visitors 
        ADD COLUMN sessions JSON
      `);
      console.log('✅ Schema updated: Added sessions column to daily_visitors.');
    }

  } catch (error) {
    console.error('❌ Failed to update schema:', error);
  }
}

// ============= MIGRATION ENDPOINT (Run once after deploy) =============
const { migrate } = require('./migrate');
app.get('/api/migrate', async (req, res) => {
  try {
    // Basic protection: Check for a secret query param or similar if needed in future
    // For now, relies on being run once manually
    console.log('🔄 Triggering manual migration...');
    await migrate();
    res.json({ success: true, message: 'Migration completed. Check server logs for details.' });
  } catch (error) {
    console.error('Migration endpoint failed:', error);
    res.status(500).json({ error: 'Migration failed', details: error.message });
  }
});

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

// Helper function to parse post data from database
function parsePostData(post) {
  return {
    ...post,
    categories: typeof post.categories === 'string' ? JSON.parse(post.categories || '[]') : (post.categories || []),
    tags: typeof post.tags === 'string' ? JSON.parse(post.tags || '[]') : (post.tags || [])
  };
}

// ============= POSTS API =============
app.get('/api/posts', async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT 
        id, title, slug, content, excerpt, status, author_id as authorId, 
        download_count as downloadCount, image as featuredImage, publish_date as publishDate, 
        categories, tags, meta_title as metaTitle, meta_description as metaDescription, 
        created_at as createdAt, updated_at as updatedAt 
      FROM posts
    `);
    res.json(posts.map(parsePostData));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.get('/api/posts/published', async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT 
        id, title, slug, content, excerpt, status, author_id as authorId, 
        download_count as downloadCount, image as featuredImage, publish_date as publishDate, 
        categories, tags, meta_title as metaTitle, meta_description as metaDescription, 
        created_at as createdAt, updated_at as updatedAt,
        download_enabled as downloadEnabled, download_url as downloadUrl, 
        download_filename as downloadFilename, download_size as downloadSize 
      FROM posts 
      WHERE status = 'published' 
      ORDER BY publish_date DESC
    `);
    res.json(posts.map(parsePostData));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch published posts' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT 
        id, title, slug, content, excerpt, status, author_id as authorId, 
        download_count as downloadCount, image as featuredImage, publish_date as publishDate, 
        categories, tags, meta_title as metaTitle, meta_description as metaDescription, 
        created_at as createdAt, updated_at as updatedAt,
        download_enabled as downloadEnabled, download_url as downloadUrl, 
        download_filename as downloadFilename, download_size as downloadSize 
      FROM posts 
      WHERE id = ?
    `, [req.params.id]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(parsePostData(posts[0]));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

app.get('/api/posts/slug/:slug', async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT 
        id, title, slug, content, excerpt, status, author_id as authorId, 
        download_count as downloadCount, image as featuredImage, publish_date as publishDate, 
        categories, tags, meta_title as metaTitle, meta_description as metaDescription, 
        created_at as createdAt, updated_at as updatedAt,
        download_enabled as downloadEnabled, download_url as downloadUrl, 
        download_filename as downloadFilename, download_size as downloadSize 
      FROM posts 
      WHERE slug = ?
    `, [req.params.slug]);

    if (posts.length === 0) {
      // Try finding by ID if slug fails (fallback)
      const [byID] = await pool.query(`
        SELECT 
          id, title, slug, content, excerpt, status, author_id as authorId, 
          download_count as downloadCount, image as featuredImage, publish_date as publishDate, 
          categories, tags, meta_title as metaTitle, meta_description as metaDescription, 
          created_at as createdAt, updated_at as updatedAt,
          download_enabled as downloadEnabled, download_url as downloadUrl, 
          download_filename as downloadFilename, download_size as downloadSize 
        FROM posts 
        WHERE id = ?
      `, [req.params.slug]);

      if (byID.length > 0) return res.json(parsePostData(byID[0]));

      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(parsePostData(posts[0]));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post by slug' });
  }
});

// Helper for generic public slug lookup (could be post, or eventually page)
app.get('/api/public/posts/:slug', async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT 
        id, title, slug, content, excerpt, status, author_id as authorId, 
        download_count as downloadCount, image as featuredImage, publish_date as publishDate, 
        categories, tags, meta_title as metaTitle, meta_description as metaDescription, 
        created_at as createdAt, updated_at as updatedAt,
        download_enabled as downloadEnabled, download_url as downloadUrl, 
        download_filename as downloadFilename, download_size as downloadSize 
      FROM posts 
      WHERE slug = ? AND status = 'published'
    `, [req.params.slug]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(parsePostData(posts[0]));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch published post by slug' });
  }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    // Map featuredImage (frontend) to image (db)
    const image = req.body.featuredImage || req.body.image;

    const newPost = {
      ...req.body,
      image, // Ensure image is set for logic usage
      id: generateId(),
      slug: req.body.slug || generateSlug(req.body.title || ''),
      excerpt: req.body.excerpt || getExcerpt(req.body.content || ''),
      metaDescription: req.body.metaDescription || getExcerpt(req.body.content || ''),
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO posts 
      (id, title, slug, content, excerpt, status, author_id, download_count, image, publish_date, categories, tags, meta_title, meta_description, created_at, updated_at, download_enabled, download_url, download_filename, download_size) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newPost.id, newPost.title, newPost.slug, newPost.content, newPost.excerpt, newPost.status, newPost.authorId,
        newPost.downloadCount, image, newPost.publishDate, JSON.stringify(newPost.categories || []), JSON.stringify(newPost.tags || []),
        newPost.metaTitle, newPost.metaDescription, newPost.createdAt, newPost.updatedAt,
        newPost.downloadEnabled, newPost.downloadUrl, newPost.downloadFilename, newPost.downloadSize
      ]
    );

    // Return with featuredImage for frontend compatibility
    res.status(201).json({ ...newPost, featuredImage: image });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const updatedAt = new Date().toISOString();
    const p = req.body;

    // We update fields if they are present in body. Ideally use dynamic query or full update.
    // For simplicity, we assume full object or critical fields are passed, but standard PUT is replacement.
    // However, existing logic was patch-like spread `...posts[index], ...req.body`.
    // Let's first fetch to ensure existence and merge manually or just update passed fields.
    // Safer for SQL: Update all columns with merged values or use COALESCE if complex.
    // Better: Fetch, Merge, Update.

    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const current = rows[0];

    // Merge: Use request body fields or fallback to current DB value
    // Note: DB columns are snake_case, body is camelCase.

    const title = p.title !== undefined ? p.title : current.title;
    const slug = p.slug !== undefined ? p.slug : current.slug;
    const content = p.content !== undefined ? p.content : current.content;
    let excerpt = p.excerpt !== undefined ? p.excerpt : current.excerpt;
    const status = p.status !== undefined ? p.status : current.status;
    const authorId = p.authorId !== undefined ? p.authorId : current.author_id;
    // Handle both featuredImage (frontend) and image (db/legacy)
    const newImage = p.featuredImage !== undefined ? p.featuredImage : (p.image !== undefined ? p.image : current.image);

    const publishDate = p.publishDate !== undefined ? p.publishDate : current.publish_date;
    const categories = p.categories !== undefined ? JSON.stringify(p.categories) : (typeof current.categories === 'string' ? current.categories : JSON.stringify(current.categories));
    const tags = p.tags !== undefined ? JSON.stringify(p.tags) : (typeof current.tags === 'string' ? current.tags : JSON.stringify(current.tags));
    const metaTitle = p.metaTitle !== undefined ? p.metaTitle : current.meta_title;
    let metaDescription = p.metaDescription !== undefined ? p.metaDescription : current.meta_description;

    const downloadEnabled = p.downloadEnabled !== undefined ? p.downloadEnabled : current.download_enabled;
    const downloadUrl = p.downloadUrl !== undefined ? p.downloadUrl : current.download_url;
    const downloadFilename = p.downloadFilename !== undefined ? p.downloadFilename : current.download_filename;
    const downloadSize = p.downloadSize !== undefined ? p.downloadSize : current.download_size;

    // Auto-generate excerpt/meta if missing but content is present (and changed)
    // If excerpt is empty (explicitly set to empty string or missing in DB) and we have content, generate it
    if (!excerpt && content) {
      excerpt = getExcerpt(content);
    }

    // Same for Meta Description
    if (!metaDescription && content) {
      metaDescription = getExcerpt(content);
    }

    // Note: We do NOT auto-update slug for existing posts to avoid breaking links, unless explicitly requested.

    await pool.query(
      `UPDATE posts SET 
      title = ?, slug = ?, content = ?, excerpt = ?, status = ?, author_id = ?, image = ?, 
      publish_date = ?, categories = ?, tags = ?, meta_title = ?, meta_description = ?, updated_at = ?,
      download_enabled = ?, download_url = ?, download_filename = ?, download_size = ?
      WHERE id = ?`,
      [title, slug, content, excerpt, status, authorId, newImage, publishDate, categories, tags, metaTitle, metaDescription, updatedAt, downloadEnabled, downloadUrl, downloadFilename, downloadSize, req.params.id]
    );

    // Return the updated object (mapped back to camelCase)
    res.json({
      id: req.params.id,
      title, slug, content, excerpt, status, authorId,
      featuredImage: newImage, // Return as featuredImage
      image: newImage,
      publishDate,
      categories: p.categories || current.categories,
      tags: p.tags || current.tags,
      metaTitle, metaDescription,
      createdAt: current.created_at, updatedAt,
      downloadEnabled, downloadUrl, downloadFilename, downloadSize
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

app.post('/api/posts/bulk-delete', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || ids.length === 0) return res.json({ deletedCount: 0 });

    // mysql2 supports 'IN (?)' where ? is an array
    const [result] = await pool.query('DELETE FROM posts WHERE id IN (?)', [ids]);
    res.json({ deletedCount: result.affectedRows });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to delete posts' });
  }
});

app.post('/api/posts/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const post = rows[0];

    const newPost = {
      id: generateId(),
      title: `${post.title} (Copy)`,
      slug: generateSlug(`${post.title} copy`), // Note: Might collide if multiple copies, but existing logic assumed it's unique enough or handled elsewhere.
      status: 'draft',
      downloadCount: 0,
      publishDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Copy other fields
      content: post.content,
      excerpt: post.excerpt,
      authorId: post.author_id,
      image: post.image,
      featuredImage: post.image, // Ensure mapped for frontend
      categories: post.categories,
      tags: post.tags,
      metaTitle: post.meta_title,
      metaDescription: post.meta_description
    };

    await pool.query(
      `INSERT INTO posts 
      (id, title, slug, content, excerpt, status, author_id, download_count, image, publish_date, categories, tags, meta_title, meta_description, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newPost.id, newPost.title, newPost.slug, newPost.content, newPost.excerpt, newPost.status, newPost.authorId,
        newPost.downloadCount, newPost.image, newPost.publishDate,
        typeof newPost.categories === 'string' ? newPost.categories : JSON.stringify(newPost.categories || []),
        typeof newPost.tags === 'string' ? newPost.tags : JSON.stringify(newPost.tags || []),
        newPost.metaTitle, newPost.metaDescription, newPost.createdAt, newPost.updatedAt
      ]
    );

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Duplicate post error:', error);
    res.status(500).json({ error: 'Failed to duplicate post' });
  }
});

app.post('/api/posts/:id/increment-download', async (req, res) => {
  try {
    // Atomic update
    const [result] = await pool.query('UPDATE posts SET download_count = download_count + 1 WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Fetch new count to return
    const [rows] = await pool.query('SELECT download_count FROM posts WHERE id = ?', [req.params.id]);
    res.json({ downloadCount: rows[0].download_count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment download count' });
  }
});

// ============= FOOTER PAGES API =============
app.get('/api/footer-pages', async (req, res) => {
  try {
    const [pages] = await pool.query('SELECT id, title, slug, content, sort_order as sortOrder, status, created_at as createdAt, updated_at as updatedAt FROM footer_pages ORDER BY sort_order ASC');
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch footer pages' });
  }
});

app.get('/api/footer-pages/published', async (req, res) => {
  try {
    const [pages] = await pool.query('SELECT id, title, slug, content, sort_order as sortOrder, status, created_at as createdAt, updated_at as updatedAt FROM footer_pages WHERE status = "published" ORDER BY sort_order ASC');
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch published footer pages' });
  }
});

app.get('/api/footer-pages/:id', async (req, res) => {
  try {
    const [pages] = await pool.query('SELECT id, title, slug, content, sort_order as sortOrder, status, created_at as createdAt, updated_at as updatedAt FROM footer_pages WHERE id = ?', [req.params.id]);
    if (pages.length === 0) return res.status(404).json({ error: 'Footer page not found' });
    res.json(pages[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch footer page' });
  }
});

app.get('/api/footer-pages/slug/:slug', async (req, res) => {
  try {
    const [pages] = await pool.query('SELECT id, title, slug, content, sort_order as sortOrder, status, created_at as createdAt, updated_at as updatedAt FROM footer_pages WHERE slug = ?', [req.params.slug]);
    if (pages.length === 0) return res.status(404).json({ error: 'Footer page not found' });
    res.json(pages[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch footer page' });
  }
});

app.post('/api/footer-pages', authenticateToken, async (req, res) => {
  try {
    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM footer_pages');
    const sortOrder = req.body.sortOrder ?? countRows[0].count;

    const newPage = {
      id: generateId(),
      title: req.body.title,
      slug: req.body.slug || generateSlug(req.body.title),
      status: req.body.status || 'published',
      content: req.body.content || '',
      sortOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await pool.query(
      'INSERT INTO footer_pages (id, title, slug, content, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newPage.id, newPage.title, newPage.slug, newPage.content, newPage.sortOrder, newPage.status, newPage.createdAt, newPage.updatedAt]
    );

    res.status(201).json(newPage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create footer page' });
  }
});

app.put('/api/footer-pages/reorder', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ids array' });

    // Transaction? Or just sequence of updates.
    for (let i = 0; i < ids.length; i++) {
      await pool.query('UPDATE footer_pages SET sort_order = ? WHERE id = ?', [i, ids[i]]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

app.put('/api/footer-pages/:id', authenticateToken, async (req, res) => {
  try {
    const updatedAt = new Date().toISOString();
    const b = req.body;

    // Fetch current
    const [rows] = await pool.query('SELECT * FROM footer_pages WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Footer page not found' });
    const current = rows[0];

    const title = b.title !== undefined ? b.title : current.title;
    const slug = b.slug !== undefined ? b.slug : current.slug;
    const content = b.content !== undefined ? b.content : current.content;
    const status = b.status !== undefined ? b.status : current.status;
    const sortOrder = b.sortOrder !== undefined ? b.sortOrder : current.sort_order;

    await pool.query(
      'UPDATE footer_pages SET title=?, slug=?, content=?, status=?, sort_order=?, updated_at=? WHERE id=?',
      [title, slug, content, status, sortOrder, updatedAt, req.params.id]
    );

    res.json({
      id: req.params.id, title, slug, content, status, sortOrder,
      createdAt: current.created_at, updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update footer page' });
  }
});

app.delete('/api/footer-pages/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM footer_pages WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Footer page not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete footer page' });
  }
});

// ============= CATEGORIES API =============
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT id, name, slug, created_at as createdAt FROM categories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT id, name, slug, created_at as createdAt FROM categories WHERE id = ?', [req.params.id]);
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(categories[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const newCategory = {
      id: generateId(),
      name: req.body.name,
      slug: req.body.slug || generateSlug(req.body.name),
      createdAt: new Date().toISOString(),
    };
    await pool.query(
      'INSERT INTO categories (id, name, slug, created_at) VALUES (?, ?, ?, ?)',
      [newCategory.id, newCategory.name, newCategory.slug, newCategory.createdAt]
    );
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { name, slug } = req.body;
    // Minimal update logic
    await pool.query(
      'UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug) WHERE id = ?',
      [name, slug, req.params.id]
    );

    const [updated] = await pool.query('SELECT id, name, slug, created_at as createdAt FROM categories WHERE id = ?', [req.params.id]);
    if (updated.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

app.get('/api/categories/:id/post-count', async (req, res) => {
  try {
    // Check if category exists in JSON array column 'categories'
    // categories is ["id1", "id2"]
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE JSON_CONTAINS(categories, ?)',
      [JSON.stringify(req.params.id)]
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Post count error:', error);
    res.status(500).json({ error: 'Failed to count posts' });
  }
});

// ============= TAGS API =============
app.get('/api/tags', async (req, res) => {
  try {
    const [tags] = await pool.query('SELECT id, name, slug, created_at as createdAt FROM tags');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

app.post('/api/tags', authenticateToken, async (req, res) => {
  try {
    const newTag = {
      id: generateId(),
      name: req.body.name,
      slug: generateSlug(req.body.name),
      createdAt: new Date().toISOString(),
    };
    await pool.query(
      'INSERT INTO tags (id, name, slug, created_at) VALUES (?, ?, ?, ?)',
      [newTag.id, newTag.name, newTag.slug, newTag.createdAt]
    );
    res.status(201).json(newTag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

app.delete('/api/tags/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tags WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// ============= MEDIA API =============
app.get('/api/media', async (req, res) => {
  try {
    const [media] = await pool.query('SELECT id, filename, url, type, size, width, height, uploaded_at as uploadedAt FROM media');
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

app.post('/api/media', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const newMedia = {
      id: generateId(),
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      type: req.file.mimetype,
      width: req.body.width ? parseInt(req.body.width) : null,
      height: req.body.height ? parseInt(req.body.height) : null,
      uploadedAt: new Date().toISOString(),
    };

    await pool.query(
      'INSERT INTO media (id, filename, url, type, size, width, height, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newMedia.id, newMedia.filename, newMedia.url, newMedia.type, newMedia.size, newMedia.width, newMedia.height, newMedia.uploadedAt]
    );

    res.status(201).json(newMedia);
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ error: 'Failed to save media metadata' });
  }
});

app.delete('/api/media/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT url FROM media WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete from disk
    const filename = rows[0].url.replace('/uploads/', '');
    deleteUploadedFile(filename);

    // Delete from DB
    await pool.query('DELETE FROM media WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// ============= SETTINGS API =============
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (rows.length === 0) return res.json(defaultSettings);

    const s = rows[0];
    const googleAds = s.google_ads_config || {};
    // Handle JSON parsing if strict mode, but mysql2 usually parses JSON columns.

    const settings = {
      siteTitle: s.site_title,
      tagline: s.tagline,
      logo: s.logo,
      postsPerPage: s.posts_per_page,
      downloadTimerDuration: s.download_timer_duration,
      adBlockerDetectionEnabled: !!s.ad_blocker_detection_enabled,
      adBlockerMessage: s.ad_blocker_message,
      googleAdsEnabled: !!s.google_ads_enabled,
      googleAdsClientId: s.google_ads_client_id,
      googleAdsCode: s.google_ads_code,
      googleAdsDisplaySlotId: googleAds.displaySlotId || '',
      googleAdsInFeedSlotId: googleAds.inFeedSlotId || '',
      googleAdsInArticleSlotId: googleAds.inArticleSlotId || '',
      googleAdsMultiplexSlotId: googleAds.multiplexSlotId || '',
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const b = req.body;
    const googleAdsConfig = {
      displaySlotId: b.googleAdsDisplaySlotId,
      inFeedSlotId: b.googleAdsInFeedSlotId,
      inArticleSlotId: b.googleAdsInArticleSlotId,
      multiplexSlotId: b.googleAdsMultiplexSlotId
    };

    await pool.query(
      `UPDATE settings SET 
       site_title=?, tagline=?, logo=?, posts_per_page=?, download_timer_duration=?, 
       ad_blocker_detection_enabled=?, ad_blocker_message=?, google_ads_enabled=?, 
       google_ads_client_id=?, google_ads_code=?, google_ads_config=? 
       WHERE id = 1`,
      [
        b.siteTitle, b.tagline, b.logo, b.postsPerPage, b.downloadTimerDuration,
        b.adBlockerDetectionEnabled, b.adBlockerMessage, b.googleAdsEnabled,
        b.googleAdsClientId, b.googleAdsCode, JSON.stringify(googleAdsConfig)
      ]
    );

    res.json(b);
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============= AUTH API =============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = users[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn });

    res.json({
      isAuthenticated: true,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Change email endpoint
app.post('/api/auth/change-email', authenticateToken, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.user.id;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = users[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Password is incorrect' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail, userId]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already in use' });

    await pool.query('UPDATE users SET email = ? WHERE id = ?', [newEmail, userId]);
    const token = jwt.sign({ id: userId, email: newEmail }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: userId, email: newEmail, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change email' });
  }
});

// ============= AUTHORS API =============
app.get('/api/authors', async (req, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    let query = 'SELECT id, name, slug, bio, credentials, image, social_links as socialLinks, expertise, is_active as isActive, is_default as isDefault, created_at as createdAt, updated_at as updatedAt FROM authors';
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    const [authors] = await pool.query(query);
    res.json(authors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

app.get('/api/authors/:id', async (req, res) => {
  try {
    const [authors] = await pool.query(
      'SELECT id, name, slug, bio, credentials, image, social_links as socialLinks, expertise, is_active as isActive, is_default as isDefault, created_at as createdAt, updated_at as updatedAt FROM authors WHERE id = ?',
      [req.params.id]
    );
    if (authors.length === 0) return res.status(404).json({ error: 'Author not found' });
    res.json(authors[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch author' });
  }
});

app.get('/api/authors/slug/:slug', async (req, res) => {
  try {
    const [authors] = await pool.query(
      'SELECT id, name, slug, bio, credentials, image, social_links as socialLinks, expertise, is_active as isActive, is_default as isDefault, created_at as createdAt, updated_at as updatedAt FROM authors WHERE slug = ?',
      [req.params.slug]
    );
    if (authors.length === 0) return res.status(404).json({ error: 'Author not found' });
    res.json(authors[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch author' });
  }
});

app.get('/api/authors/:id/posts', async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT 
        id, title, slug, content, excerpt, status, author_id as authorId, 
        download_count as downloadCount, image, publish_date as publishDate, 
        categories, tags, meta_title as metaTitle, meta_description as metaDescription, 
        created_at as createdAt, updated_at as updatedAt,
        download_enabled as downloadEnabled, download_url as downloadUrl, 
        download_filename as downloadFilename, download_size as downloadSize 
      FROM posts 
      WHERE author_id = ? AND status = 'published' 
      ORDER BY publish_date DESC
    `, [req.params.id]);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch author posts' });
  }
});

app.post('/api/authors', authenticateToken, async (req, res) => {
  try {
    const newAuthor = {
      ...req.body,
      id: generateId(),
      slug: req.body.slug || generateSlug(req.body.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO authors 
      (id, name, slug, bio, credentials, image, social_links, expertise, is_active, is_default, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newAuthor.id, newAuthor.name, newAuthor.slug, newAuthor.bio, newAuthor.credentials,
        newAuthor.image, JSON.stringify(newAuthor.socialLinks || {}), JSON.stringify(newAuthor.expertise || []),
        newAuthor.isActive, false, newAuthor.createdAt, newAuthor.updatedAt
      ]
    );

    res.status(201).json(newAuthor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create author' });
  }
});

app.put('/api/authors/:id', authenticateToken, async (req, res) => {
  try {
    const updatedAt = new Date().toISOString();
    const b = req.body;

    const [rows] = await pool.query('SELECT * FROM authors WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Author not found' });
    const current = rows[0];

    const name = b.name !== undefined ? b.name : current.name;
    const slug = b.slug !== undefined ? b.slug : current.slug;
    const bio = b.bio !== undefined ? b.bio : current.bio;
    const credentials = b.credentials !== undefined ? b.credentials : current.credentials;
    const image = b.image !== undefined ? b.image : current.image;
    const socialLinks = b.socialLinks !== undefined ? JSON.stringify(b.socialLinks) : (typeof current.social_links === 'string' ? current.social_links : JSON.stringify(current.social_links));
    const expertise = b.expertise !== undefined ? JSON.stringify(b.expertise) : (typeof current.expertise === 'string' ? current.expertise : JSON.stringify(current.expertise));
    const isActive = b.isActive !== undefined ? b.isActive : current.is_active;

    await pool.query(
      `UPDATE authors SET 
      name=?, slug=?, bio=?, credentials=?, image=?, social_links=?, expertise=?, is_active=?, updated_at=?
      WHERE id=?`,
      [name, slug, bio, credentials, image, socialLinks, expertise, isActive, updatedAt, req.params.id]
    );

    res.json({
      id: req.params.id, name, slug, bio, credentials, image,
      socialLinks: b.socialLinks || current.social_links,
      expertise: b.expertise || current.expertise,
      isActive, isDefault: current.is_default, createdAt: current.created_at, updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update author' });
  }
});

app.delete('/api/authors/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT is_default as isDefault FROM authors WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Author not found' });

    if (rows[0].isDefault) {
      return res.status(400).json({ error: 'Cannot delete default author' });
    }

    await pool.query('DELETE FROM authors WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete author' });
  }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];

    res.json({
      isAuthenticated: true,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.created_at },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// ============= VISITOR TRACKING API =============
// Helper: Live sessions are ephemeral. For MySQL, we'd need a live_sessions table or distinct active user query.
// Since schema doesn't have live_sessions, we will skip it or Mock it? 
// Actually, user wants persistence. I should add live_sessions table if I can.
// Or just ignore live sessions for now and focus on persistent analytics.
// Check schema.sql again... I did NOT include live_sessions.
// Let's rely on daily_visitors which IS in schema.

// GET /api/analytics/summary
app.get('/api/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // Simple implementation: Fetch all and aggregate in memory (simplest migration) 
    // or wrote complex SQL.
    // Fetch last 30 days
    const [rows] = await pool.query('SELECT * FROM daily_visitors ORDER BY date DESC LIMIT 30');

    const todayRecord = rows.find(r => parseDate(r.date) === today) || { unique_visitors: 0 };
    const yesterdayRecord = rows.find(r => parseDate(r.date) === yesterday) || { unique_visitors: 0 };

    const visitors_7d = rows.slice(0, 7).reduce((sum, r) => sum + r.unique_visitors, 0);
    const visitors_30d = rows.reduce((sum, r) => sum + r.unique_visitors, 0);

    // Live visitors? Return 0 for now as we dropped live_sessions table in V1 schema
    // or add it. Let's return 0. To fix, we need a table.

    res.json({
      visitors_today: todayRecord.unique_visitors,
      visitors_yesterday: yesterdayRecord.unique_visitors,
      visitors_7d,
      visitors_30d,
      live_visitors: 0, // Not implemented in V1 MySQL Schema
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

function parseDate(d) {
  // MySQL date might be object or string
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d).split('T')[0];
}

// GET /api/analytics/daily
app.get('/api/analytics/daily', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const [rows] = await pool.query('SELECT * FROM daily_visitors ORDER BY date DESC LIMIT ?', [days]);

    // Fill gaps
    const result = [];
    const map = new Map();
    rows.forEach(r => map.set(parseDate(r.date), r));

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = map.get(dateStr);
      result.push({
        date: dateStr,
        unique_visitors: record ? record.unique_visitors : 0,
        total_pageviews: record ? record.total_pageviews : 0
      });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily analytics' });
  }
});

// POST /api/track
app.post('/api/track', async (req, res) => {
  try {
    const { session_id, page_url } = req.body;
    if (!session_id || !page_url) return res.status(400).json({ error: 'Missing fields' });

    const today = new Date().toISOString().split('T')[0];

    // UPSERT daily_visitors with session tracking
    const [rows] = await pool.query('SELECT * FROM daily_visitors WHERE date = ?', [today]);

    if (rows.length === 0) {
      // New day record
      await pool.query(`
        INSERT INTO daily_visitors (date, unique_visitors, total_pageviews, sessions, last_updated)
        VALUES (?, 1, 1, ?, NOW())
      `, [today, JSON.stringify([session_id])]);
    } else {
      const record = rows[0];
      let sessions = [];
      try {
        sessions = typeof record.sessions === 'string' ? JSON.parse(record.sessions) : (record.sessions || []);
      } catch (e) {
        sessions = [];
      }

      const isNewVisitor = !sessions.includes(session_id);

      if (isNewVisitor) {
        sessions.push(session_id);
      }

      await pool.query(`
        UPDATE daily_visitors 
        SET 
          unique_visitors = unique_visitors + ?,
          total_pageviews = total_pageviews + 1,
          sessions = ?,
          last_updated = NOW()
        WHERE date = ?
      `, [isNewVisitor ? 1 : 0, JSON.stringify(sessions), today]);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Tracking error', e);
    // Return success to not break frontend
    res.json({ success: true });
  }
});

// ============= STATS API =============
// ============= STATS API =============
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [postRows] = await pool.query('SELECT COUNT(*) as total, SUM(download_count) as downloads FROM posts');
    const [postsThisMonth] = await pool.query('SELECT COUNT(*) as count FROM posts WHERE created_at >= ?', [startOfMonth]);
    const [mediaRows] = await pool.query('SELECT COUNT(*) as count FROM media');
    const [catRows] = await pool.query('SELECT COUNT(*) as count FROM categories');

    res.json({
      totalPosts: postRows[0].total,
      totalDownloads: postRows[0].downloads || 0,
      postsThisMonth: postsThisMonth[0].count,
      totalMedia: mediaRows[0].count,
      totalCategories: catRows[0].count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
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

  // The file is already saved to the persistent path by Multer (configured via storage.js -> getUploadsPath)
  // We just return the URL relative to the domain (served via express.static)
  console.log(`✅ File saved to: ${req.file.path}`);

  res.json({
    filename: req.file.filename,
    url: `/media/${req.file.filename}`, // Maps to persistent storage via app.use('/media', ...)
    size: req.file.size,
    type: req.file.mimetype,
  });
});

// ============= MEDIA DELETE API =============
app.delete('/api/media/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    // 1. Delete file from Persistent Storage
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    } else {
      console.warn(`⚠️ File not found (skipping filesystem delete): ${filePath}`);
    }

    // 2. Remove from Database
    await pool.query('DELETE FROM media WHERE filename = ?', [safeFilename]);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ============= UNIFIED FRONTEND SERVING (SPA) =============
const frontendPath = path.join(__dirname, '..', 'dist');

// 1. Serve static assets (JS, CSS, Images)
app.use(express.static(frontendPath));

// 2. API 404 Handler (Must be before SPA fallback)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Helper to replace placeholders
const replaceMetaTags = (html, metadata) => {
  return html
    .replace(/__OG_TITLE__/g, metadata.title || 'Deadloops - Music Production Resources & Tutorials')
    .replace(/__OG_DESCRIPTION__/g, metadata.description || 'Music production resources, tutorials, and free downloads for producers and beatmakers.')
    .replace(/__OG_IMAGE__/g, metadata.image || 'https://deadloops.com/logo.webp')
    .replace(/__OG_URL__/g, metadata.url || 'https://deadloops.com');
};

// 3. Dynamic OG Tags for Root Level Posts (Logic unification)
async function servePostWithTags(req, res, next) {
  try {
    const { slug } = req.params;

    // Ignore static assets or API calls that might slip through (though express.static handles most)
    if (slug.includes('.') && !slug.endsWith('.html')) return next();

    // RESERVED ROUTES PROTECTION
    // These paths should never be queried as blog posts
    const reserved = [
      'admin',
      'api',
      'media',
      'uploads',
      'login',
      'dashboard',
      'rss.xml',
      'sitemap.xml',
      'robots.txt'
    ];

    if (reserved.includes(slug)) return next();

    // pool is already a promise pool from db.js
    const [posts] = await pool.query(
      'SELECT title, excerpt, image FROM posts WHERE slug = ? AND status = "published"',
      [slug]
    );

    // If no post found, it might be a client-side route, hub, or pillar. 
    // Pass to SPA fallback (next())
    if (posts.length === 0) {
      return next();
    }

    const filePath = path.join(frontendPath, 'index.html');

    // Check if file exists to avoid crashes
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Index file not found');
    }

    let html = fs.readFileSync(filePath, 'utf8');

    const post = posts[0];
    // Robust image URL generation
    let imageUrl = 'https://deadloops.com/logo.webp';

    if (post.image) {
      if (post.image.startsWith('http')) {
        imageUrl = post.image;
      } else {
        // Ensure no double slashes if post.image starts with /
        const imagePath = post.image.startsWith('/') ? post.image : `/${post.image}`;
        imageUrl = `https://deadloops.com${imagePath}`;
      }
    }

    html = replaceMetaTags(html, {
      title: post.title,
      description: post.excerpt,
      image: imageUrl,
      url: `https://deadloops.com/${slug}`
    });

    res.send(html);
  } catch (error) {
    console.error('Error serving blog post with OG tags:', error);
    next();
  }
}

// 4. Redirect /blog/:slug to /:slug (Legacy Support)
app.get('/blog/:slug', (req, res) => {
  res.redirect(301, `/${req.params.slug}`);
});

// 5. Redirect /post/:slug to /:slug (Legacy Support)
app.get('/post/:slug', (req, res) => {
  res.redirect(301, `/${req.params.slug}`);
});

// 6. Root Level Post Handler
// Checks if the slug is a post. If so, serves it with tags. If not, falls back to SPA.
app.get('/:slug', servePostWithTags);

// ============= SITEMAP GENERATOR =============
const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const { Readable } = require('stream');

let sitemapCache = null;
let lastSitemapTime = 0;
const SITEMAP_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes

app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');

  // Check cache
  if (sitemapCache && (Date.now() - lastSitemapTime < SITEMAP_CACHE_DURATION)) {
    return res.send(sitemapCache);
  }

  try {
    const smStream = new SitemapStream({ hostname: 'https://deadloops.com' });
    const pipeline = smStream.pipe(createGzip());

    // 1. Static Pages
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    smStream.write({ url: '/blog', changefreq: 'daily', priority: 0.8 });

    // 2. Dynamic Posts
    const [posts] = await pool.query(
      'SELECT slug, updated_at, publish_date FROM posts WHERE status = "published"'
    );

    posts.forEach(post => {
      const date = post.updated_at || post.publish_date || new Date();
      smStream.write({
        url: `/${post.slug}`,
        lastmod: new Date(date).toISOString(),
        changefreq: 'weekly',
        priority: 0.7
      });
    });

    smStream.end();

    // Cache the result (Buffer)
    const sm = await streamToPromise(pipeline);
    sitemapCache = sm;
    lastSitemapTime = Date.now();
    res.send(sm);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Write error to file for debugging via SSH
    try {
      fs.writeFileSync(path.join(__dirname, 'sitemap_error.log'), error.toString() + '\\n' + error.stack);
    } catch (e) { }
    res.status(500).end();
  }
});


// 7. SPA Fallback - Handles all other routes
// Replaces placeholders with default values
app.get('*', (req, res) => {
  const filePath = path.join(frontendPath, 'index.html');

  if (fs.existsSync(filePath)) {
    let html = fs.readFileSync(filePath, 'utf8');
    // Inject defaults for all non-blog pages
    html = replaceMetaTags(html, {});
    res.send(html);
  } else {
    res.status(404).send('Site under maintenance');
  }
});

// Initialize and start server with error handling
async function start() {
  try {
    await initializeDefaultUser();
    await initializeSettings();
    await ensureSchemaUpdates();
    await initializeDefaultAuthor();

    app.listen(PORT, () => {
      console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
      console.log(`📁 Data directory: ${path.resolve(__dirname, 'data')}`);
      console.log(`📸 Uploads directory: ${getUploadsPath()}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
}

start();
