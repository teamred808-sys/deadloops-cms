-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Authors Table
CREATE TABLE IF NOT EXISTS authors (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  credentials VARCHAR(255),
  image VARCHAR(255),
  social_links JSON,
  expertise JSON,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content LONGTEXT,
  excerpt TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  author_id VARCHAR(36),
  download_count INT DEFAULT 0,
  image VARCHAR(255),
  publish_date DATETIME,
  categories JSON, -- Storing as JSON array for migration simplicity, or can be normalized later
  tags JSON,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Media Table
CREATE TABLE IF NOT EXISTS media (
  id VARCHAR(36) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  size INT,
  width INT,
  height INT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table (Single Row)
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_title VARCHAR(255),
  tagline VARCHAR(255),
  logo VARCHAR(255),
  posts_per_page INT DEFAULT 12,
  download_timer_duration INT DEFAULT 15,
  ad_blocker_detection_enabled BOOLEAN DEFAULT FALSE,
  ad_blocker_message TEXT,
  google_ads_enabled BOOLEAN DEFAULT FALSE,
  google_ads_client_id VARCHAR(255),
  google_ads_code TEXT,
  google_ads_config JSON -- Stores slot IDs and other nested config
);

-- Footer Pages Table
CREATE TABLE IF NOT EXISTS footer_pages (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content LONGTEXT,
  sort_order INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Analytics (Simplified for migration)
CREATE TABLE IF NOT EXISTS daily_visitors (
  date DATE PRIMARY KEY,
  unique_visitors INT DEFAULT 0,
  total_pageviews INT DEFAULT 0,
  last_updated DATETIME
);
