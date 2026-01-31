const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const { readJsonFile } = require('./storage');

async function migrate() {
    try {
        console.log('🚀 Starting migration...');

        // 1. Create Tables
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            await pool.query(statement);
        }
        console.log('✅ Base schema created.');

        // 2. Migrate Users
        const users = readJsonFile('users.json', []);
        for (const user of users) {
            await pool.query(
                'INSERT IGNORE INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)',
                [user.id, user.email, user.passwordHash, user.name, user.createdAt]
            );
        }
        console.log(`✅ Migrated ${users.length} users.`);

        // 3. Migrate Authors
        const authors = readJsonFile('authors.json', []);
        for (const author of authors) {
            await pool.query(
                `INSERT IGNORE INTO authors 
        (id, name, slug, bio, credentials, image, social_links, expertise, is_active, is_default, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    author.id, author.name, author.slug, author.bio, author.credentials, author.image,
                    JSON.stringify(author.socialLinks), JSON.stringify(author.expertise),
                    author.isActive, author.isDefault, author.createdAt, author.updatedAt
                ]
            );
        }
        console.log(`✅ Migrated ${authors.length} authors.`);

        // 4. Migrate Categories
        const categories = readJsonFile('categories.json', []);
        for (const cat of categories) {
            await pool.query(
                'INSERT IGNORE INTO categories (id, name, slug, created_at) VALUES (?, ?, ?, ?)',
                [cat.id, cat.name, cat.slug, cat.createdAt]
            );
        }
        console.log(`✅ Migrated ${categories.length} categories.`);

        // 5. Migrate Tags
        const tags = readJsonFile('tags.json', []);
        for (const tag of tags) {
            await pool.query(
                'INSERT IGNORE INTO tags (id, name, slug, created_at) VALUES (?, ?, ?, ?)',
                [tag.id, tag.name, tag.slug, tag.createdAt]
            );
        }
        console.log(`✅ Migrated ${tags.length} tags.`);

        // 6. Migrate Posts
        const posts = readJsonFile('posts.json', []);
        for (const post of posts) {
            await pool.query(
                `INSERT IGNORE INTO posts 
        (id, title, slug, content, excerpt, status, author_id, download_count, image, publish_date, categories, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    post.id, post.title, post.slug, post.content, post.excerpt, post.status, post.authorId,
                    post.downloadCount, post.image, post.publishDate, JSON.stringify(post.categories),
                    post.createdAt, post.updatedAt
                ]
            );
        }
        console.log(`✅ Migrated ${posts.length} posts.`);

        // 7. Migrate Media
        const media = readJsonFile('media.json', []);
        for (const item of media) {
            await pool.query(
                `INSERT IGNORE INTO media (id, filename, url, type, size, width, height, uploaded_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.id, item.filename, item.url, item.type, item.size,
                    item.width || null, item.height || null, item.uploadedAt
                ]
            );
        }
        console.log(`✅ Migrated ${media.length} media items.`);

        // 8. Migrate Settings
        const settings = readJsonFile('settings.json', null);
        if (settings) {
            const googleAdsConfig = {
                displaySlotId: settings.googleAdsDisplaySlotId,
                inFeedSlotId: settings.googleAdsInFeedSlotId,
                inArticleSlotId: settings.googleAdsInArticleSlotId,
                multiplexSlotId: settings.googleAdsMultiplexSlotId
            };

            await pool.query(
                `INSERT IGNORE INTO settings 
        (id, site_title, tagline, logo, posts_per_page, download_timer_duration, 
         ad_blocker_detection_enabled, ad_blocker_message, google_ads_enabled, 
         google_ads_client_id, google_ads_code, google_ads_config) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE site_title = VALUES(site_title)`,
                [
                    settings.siteTitle, settings.tagline, settings.logo, settings.postsPerPage,
                    settings.downloadTimerDuration, settings.adBlockerDetectionEnabled, settings.adBlockerMessage,
                    settings.googleAdsEnabled, settings.googleAdsClientId, settings.googleAdsCode,
                    JSON.stringify(googleAdsConfig)
                ]
            );
            console.log('✅ Migrated Settings.');
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

process.exit(1);
  }
}

module.exports = { migrate };

if (require.main === module) {
    migrate();
}
