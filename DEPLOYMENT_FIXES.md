# Deployment Fix Checklist

## Common Deployment Issues & Solutions

### 1. Environment Variables
Make sure these are set in your deployment platform:
- MONGODB_URI
- NEXTAUTH_URL (should be your production domain)
- NEXTAUTH_SECRET
- JWT_SECRET
- SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD
- LIPILA_SECRET_KEY, LIPILA_BASE_URL, LIPILA_CURRENCY

### 2. Build Configuration
- Next.js config has ignoreBuildErrors: true (this might hide issues)
- ESLint is ignored during builds
- TypeScript errors are ignored

### 3. Platform-Specific Issues
- Vercel: Check vercel.json configuration
- Netlify: Check netlify.toml
- Railway: Check railway.json
- Render: Check render.yaml

### 4. Dependencies
- All dependencies are properly installed
- Node.js version compatibility
- Build scripts are correct

### 5. Static Files
- Favicon.ico exists in public/
- Background.jpg exists in public/
- All required static assets are present

## Quick Fixes to Try:

1. **Update Next.js config to be more strict:**
   - Remove ignoreBuildErrors: true
   - Remove ignoreDuringBuilds: true
   - Fix any TypeScript/ESLint errors

2. **Check environment variables:**
   - Ensure all required env vars are set
   - Use production URLs for NEXTAUTH_URL

3. **Test build locally:**
   - Run `npm run build`
   - Check for any errors

4. **Platform-specific fixes:**
   - Vercel: Check build logs
   - Netlify: Check deploy logs
   - Railway: Check build logs
