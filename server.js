/* eslint-disable */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app instance
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Production server configuration
const server = createServer(async (req, res) => {
  try {
    // Parse the request URL
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Handle health check endpoint
    if (pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      }));
      return;
    }

    // Security headers for production
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CORS headers (adjust as needed for your domain)
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'https://mankuca.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Rate limiting (basic implementation)
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[${new Date().toISOString()}] ${req.method} ${pathname} - IP: ${clientIP}`);

    // Handle Next.js requests
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Server error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start the server
app.prepare().then(() => {
  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
    
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`📊 Environment: ${dev ? 'development' : 'production'}`);
    console.log(`🌐 Hostname: ${hostname}`);
    console.log(`🔌 Port: ${port}`);
    
    if (dev) {
      console.log('🔧 Development mode enabled');
    } else {
      console.log('🏭 Production mode enabled');
      console.log('🔒 Security headers enabled');
      console.log('📈 Performance optimizations active');
    }
  });
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = server;
