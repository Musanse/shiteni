# Mankuca Production Deployment Guide

## 🚀 Production Server Setup

### 1. Environment Configuration

Create a `.env.production.local` file with the following variables:

```bash
# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mankuca-prod
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mankuca-prod

# Email Configuration (SMTP)
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USERNAME=noreply@your-domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@your-domain.com
SMTP_FROM_NAME=Mankuca Platform
SMTP_ENCRYPTION=tls

# Lipila Payment Gateway Configuration
LIPILA_SECRET_KEY=your-lipila-secret-key-here
LIPILA_BASE_URL=https://lipila-prod.hobbiton.app
LIPILA_CURRENCY=ZMW
LIPILA_MOCK_MODE=false

# Server Configuration
HOSTNAME=0.0.0.0
PORT=3000
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Security Configuration
JWT_SECRET=your-jwt-secret-key-here
```

### 2. Production Build Commands

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm run start:prod
```

### 3. Server Configuration

The `server.js` file includes:

- ✅ **Security Headers**: XSS protection, content type options, frame options
- ✅ **CORS Configuration**: Configurable allowed origins
- ✅ **Rate Limiting**: Basic IP-based rate limiting
- ✅ **Health Check**: `/health` endpoint for monitoring
- ✅ **Graceful Shutdown**: Proper SIGTERM/SIGINT handling
- ✅ **Error Handling**: Comprehensive error catching
- ✅ **Logging**: Request logging with timestamps

### 4. Deployment Options

#### Option A: Traditional VPS/Server
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repository
git clone https://github.com/your-username/mankuca.git
cd mankuca

# Install dependencies
npm install

# Build and start
npm run build:prod
```

#### Option B: Docker Deployment
Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

#### Option C: PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "mankuca"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 7. Database Setup

#### MongoDB Local Installation
```bash
# Install MongoDB
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

### 8. Monitoring and Logging

#### Health Check Endpoint
```bash
curl http://your-domain.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

#### Log Monitoring
```bash
# View application logs
pm2 logs mankuca

# View system logs
sudo journalctl -u nginx
```

### 9. Security Checklist

- ✅ **Environment Variables**: All secrets in environment variables
- ✅ **HTTPS**: SSL certificate installed
- ✅ **Security Headers**: Implemented in server.js
- ✅ **Database Security**: MongoDB authentication enabled
- ✅ **Email Security**: SMTP with TLS encryption
- ✅ **Payment Security**: Lipila API keys secured
- ✅ **Access Control**: Proper CORS configuration

### 10. Performance Optimization

- ✅ **Next.js Build**: Optimized production build
- ✅ **Static Assets**: CDN for static files (optional)
- ✅ **Database Indexing**: Proper MongoDB indexes
- ✅ **Caching**: Browser and server-side caching
- ✅ **Compression**: Gzip compression enabled

### 11. Backup Strategy

```bash
# Database backup
mongodump --uri="mongodb://localhost:27017/mankuca-prod" --out=/backup/$(date +%Y%m%d)

# Application backup
tar -czf /backup/mankuca-$(date +%Y%m%d).tar.gz /path/to/mankuca
```

### 12. Troubleshooting

#### Common Issues:
1. **Port Already in Use**: Change PORT in environment variables
2. **Database Connection**: Check MongoDB URI and network access
3. **Email Not Sending**: Verify SMTP credentials and firewall
4. **Payment Issues**: Check Lipila API keys and network connectivity

#### Log Locations:
- Application logs: `pm2 logs mankuca`
- Nginx logs: `/var/log/nginx/error.log`
- System logs: `sudo journalctl -f`

### 13. Maintenance

#### Regular Tasks:
- ✅ **Security Updates**: Keep dependencies updated
- ✅ **Database Maintenance**: Regular backups and optimization
- ✅ **Log Rotation**: Prevent log files from growing too large
- ✅ **Performance Monitoring**: Monitor server resources
- ✅ **SSL Certificate Renewal**: Automatic renewal with Certbot

---

## 🎯 Quick Start Commands

```bash
# Development
npm run dev

# Production Build
npm run build:prod

# Production Start
npm run start:prod

# Health Check
curl http://localhost:3000/health
```

Your Mankuca platform is now ready for production deployment! 🚀
