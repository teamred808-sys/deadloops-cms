# Blog Server

Express.js backend server with file-based JSON storage.

## Setup

```bash
cd server
npm install
```

## Development

```bash
npm run dev
```

Server runs on http://localhost:3001

## Production

```bash
npm run build
npm start
```

## Default Credentials

- Email: admin@blog.com
- Password: admin123

## Storage

- **Data files**: `server/data/` (posts, categories, settings, etc.)
- **Uploads**: `server/uploads/` (media files)
- **Limit**: 10GB (configurable)

## Environment Variables

- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)

---

# Hostinger Cloud Deployment Guide

## Prerequisites

- Hostinger Cloud VPS with Node.js 20
- SSH access to your server
- Git repository connected

## Critical: Build Before Commit

Hostinger Cloud Express preset does **NOT** run `vite build`. You must build locally and commit the `dist/` folder.

## Step-by-Step Deployment

### 1. Build Frontend Locally

```bash
# In project root
npm run build
```

Verify the build:
```bash
ls -la dist/
# Should show: index.html, assets/
```

### 2. Commit Everything

```bash
# Remove dist from .gitignore if present
git add dist/
git add .
git commit -m "Add production build"
git push
```

### 3. Server Setup (SSH)

```bash
# Connect to your server
ssh user@your-server-ip

# Navigate to project
cd /var/www/blog

# Pull latest
git pull

# Install dependencies
npm install
cd server && npm install
```

### 4. Start with PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start server
cd /var/www/blog
pm2 start server/index.js --name "blog-server"
pm2 save
pm2 startup
```

### 5. Configure Nginx

Create/edit `/etc/nginx/sites-available/blog`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL with Certbot

```bash
sudo certbot --nginx -d your-domain.com
```

## Verification

Test these URLs after deployment:

| URL | Expected |
|-----|----------|
| `/api/health` | `{"status":"ok","timestamp":"..."}` |
| `/api/settings` | JSON settings object |
| `/` | Full React app loads |

## Troubleshooting

### White Screen
- Check if `dist/` folder exists on server
- Verify Express is running: `pm2 status`
- Check Nginx config: `sudo nginx -t`

### API Returns HTML
- Nginx not proxying to Express
- Express not running on port 3001

### Check Logs
```bash
pm2 logs blog-server
sudo tail -f /var/log/nginx/error.log
```
