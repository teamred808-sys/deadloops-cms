const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Data directory paths - use process.env.PERSISTENT_STORAGE_PATH if available, otherwise fallback to local
// This ensures persistence on Hostinger when mapped to /home/u12345/uploads
const BASE_DIR = process.env.PERSISTENT_STORAGE_PATH
  ? path.resolve(process.env.PERSISTENT_STORAGE_PATH)
  : path.resolve('data'); // Default to root/data

const DATA_DIR = BASE_DIR; // Keep data in root/data or custom path

// Strict adherence to UPLOAD_DIR, otherwise use persistent storage if provided
let UPLOADS_DIR = process.env.UPLOAD_DIR || process.env.PERSISTENT_STORAGE_PATH || '/home/u837896566/uploads';
UPLOADS_DIR = path.resolve(UPLOADS_DIR);

// Robust Path Resolution: Test write permissions and fallback
function resolveUploadPath(preferredPath) {
  const localFallback = path.join(__dirname, 'uploads');

  // Helper to test writability
  const isWritable = (dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.accessSync(dirPath, fs.constants.W_OK);
      // Double check by writing a test file (fs.access can be misleading in some containers)
      const testFile = path.join(dirPath, `.write_test_${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return true;
    } catch (error) {
      console.warn(`⚠️ Path is not writable or accessible: ${dirPath}`, error.message);
      return false;
    }
  };

  if (isWritable(preferredPath)) {
    return preferredPath;
  }

  console.warn(`⚠️ Preferred path ${preferredPath} failed write test. Falling back to local: ${localFallback}`);

  if (isWritable(localFallback)) {
    return localFallback;
  }

  // Last resort: try /tmp
  console.error(`❌ Local fallback also failed. Trying /tmp...`);
  return '/tmp/uploads';
}

UPLOADS_DIR = resolveUploadPath(UPLOADS_DIR);

console.log(`📂 Storage Configuration:`);
console.log(`   - Data: ${DATA_DIR}`);
console.log(`   - Uploads: ${UPLOADS_DIR} (Write Verified)`);

// Ensure directories exist (Redundant but safe)
function ensureDirectories() {
  // ... existing code for DATA_DIR ...
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error('Failed to create DATA_DIR:', e);
    }
  }
  // No need to create UPLOADS_DIR here as resolveUploadPath already did it/checked it
}

// Read JSON file
function readJsonFile(filename, defaultValue) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return defaultValue;
  }
}

// Write JSON file
function writeJsonFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

// Get storage usage (in bytes)
function getStorageUsage() {
  let totalSize = 0;

  // Calculate data directory size
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    for (const file of files) {
      const filepath = path.join(DATA_DIR, file);
      const stats = fs.statSync(filepath);
      totalSize += stats.size;
    }
  }

  // Calculate uploads directory size
  if (fs.existsSync(UPLOADS_DIR)) {
    const calculateDirSize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
          size += calculateDirSize(filepath);
        } else {
          size += stats.size;
        }
      }
      return size;
    };
    totalSize += calculateDirSize(UPLOADS_DIR);
  }

  const usedMB = totalSize / (1024 * 1024);
  const limitMB = 10240; // 10GB limit

  return {
    used: usedMB,
    limit: limitMB,
    percentage: (usedMB / limitMB) * 100,
  };
}

// Get data directory path
function getDataPath() {
  return DATA_DIR;
}

// Get uploads directory path
function getUploadsPath() {
  return UPLOADS_DIR;
}

// Delete file from uploads
function deleteUploadedFile(filename) {
  const filepath = path.join(UPLOADS_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting ${filename}:`, error);
    return false;
  }
}

// Generate unique ID
function generateId() {
  return crypto.randomUUID();
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate excerpt from content (strip HTML, max 160 chars)
function getExcerpt(content, maxLength = 160) {
  if (!content) return '';
  // Strip HTML tags
  const plainText = content.replace(/<[^>]+>/g, '');
  // Trim and slice
  if (plainText.length <= maxLength) return plainText.trim();
  return plainText.substring(0, maxLength).trim() + '...';
}

module.exports = {
  ensureDirectories,
  readJsonFile,
  writeJsonFile,
  getStorageUsage,
  getDataPath,
  getUploadsPath,
  deleteUploadedFile,
  generateId,
  generateSlug,
  getExcerpt
};
