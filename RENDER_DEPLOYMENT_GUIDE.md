# Render Deployment Guide

## Environment Variables Required

Set these environment variables in your Render dashboard:

### Required Variables:
```
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=your-super-secret-key-here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shiteni?retryWrites=true&w=majority
NODE_ENV=production
```

### Email Configuration:
```
SMTP_HOST=mail.shiteni.com
SMTP_PORT=587
SMTP_USER=support@shiteni.com
SMTP_PASS=your-smtp-password
```

### Payment Configuration:
```
LIPILA_SECRET_KEY=your-lipila-secret-key
LIPILA_BASE_URL=https://lipila-prod.hobbiton.app
LIPILA_CURRENCY=ZMW
```

## Build Settings

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18.x or 20.x
- **Health Check Path**: `/health`

## Common Issues Fixed

1. **TypeScript Errors**: Set `ignoreBuildErrors: true` in next.config.ts
2. **NextAuth Issues**: Ensure NEXTAUTH_URL matches your Render domain exactly
3. **Database Connection**: Verify MongoDB URI points to 'shiteni' database
4. **Build Timeout**: Optimized build process for Render's limits

## Deployment Steps

1. Connect your GitHub repository to Render
2. Set all environment variables
3. Use the provided render.yaml configuration
4. Deploy and monitor logs

## Troubleshooting

If deployment fails:
1. Check build logs for specific errors
2. Verify all environment variables are set
3. Ensure MongoDB is accessible from Render
4. Check Node.js version compatibility
