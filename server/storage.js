import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory paths - use path.resolve for Hostinger reliability
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

// Ensure directories exist
export function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// Read JSON file
export function readJsonFile(filename, defaultValue) {
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
export function writeJsonFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

// Get storage usage (in bytes)
export function getStorageUsage() {
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
export function getDataPath() {
  return DATA_DIR;
}

// Get uploads directory path
export function getUploadsPath() {
  return UPLOADS_DIR;
}

// Delete file from uploads
export function deleteUploadedFile(filename) {
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
export function generateId() {
  return crypto.randomUUID();
}

// Generate slug from title
export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
