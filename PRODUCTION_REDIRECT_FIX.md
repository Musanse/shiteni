# Production Redirect Fix Guide

## Issue: Redirects work locally but fail online

### Root Causes:
1. **Environment Variables**: Missing or incorrect `NEXTAUTH_URL` in production
2. **Domain Configuration**: Hardcoded localhost URLs in redirect logic
3. **Session Persistence**: Different session handling in production vs development
4. **CORS Issues**: Cross-origin redirects blocked by browser security

## Fixes Applied:

### 1. Updated NextAuth Configuration (`src/lib/auth.ts`)
- Added production-aware redirect callback
- Enhanced URL validation for production domains
- Added debug logging for redirect troubleshooting
- Improved session configuration

### 2. Updated Sign-in Page (`src/app/auth/signin/page.tsx`)
- Dynamic URL detection for production vs development
- Proper base URL handling for redirects
- Enhanced logging for debugging

### 3. Required Environment Variables for Production

Add these to your production environment (Vercel, Netlify, etc.):

```bash
# Required for NextAuth in production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-here

# Optional but recommended
NODE_ENV=production
```

## Deployment Steps:

### For Vercel:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `NEXTAUTH_URL` = `https://your-domain.vercel.app`
   - `NEXTAUTH_SECRET` = Generate a random secret key
5. Redeploy your application

### For Other Platforms:
1. Set environment variables in your hosting platform
2. Ensure `NEXTAUTH_URL` matches your production domain exactly
3. Use HTTPS URLs for production

## Testing Production Redirects:

1. Deploy the updated code
2. Test login flow on production
3. Check browser console for redirect logs
4. Verify session persistence

## Common Production Issues:

### Issue 1: CORS Errors
**Solution**: Ensure `NEXTAUTH_URL` matches your production domain exactly

### Issue 2: Session Not Persisting
**Solution**: Check that cookies are being set correctly in production

### Issue 3: Redirect Loops
**Solution**: Verify middleware configuration and public paths

## Debug Steps:

1. Check browser console for redirect logs
2. Verify environment variables in production
3. Test session endpoint: `/api/auth/session`
4. Check network tab for failed requests

## Environment Variable Examples:

### Development (.env.local):
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key
```

### Production (Vercel):
```bash
NEXTAUTH_URL=https://mankuca.vercel.app
NEXTAUTH_SECRET=production-super-secret-key-here
```

## Additional Recommendations:

1. **Use HTTPS**: Always use HTTPS in production
2. **Secure Secrets**: Use strong, random secret keys
3. **Domain Validation**: Ensure domains match exactly
4. **Session Timeout**: Configure appropriate session timeouts
5. **Error Handling**: Add proper error handling for redirect failures

## Troubleshooting Commands:

```bash
# Check if environment variables are set
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET

# Test session endpoint
curl https://your-domain.com/api/auth/session

# Check redirect logs in browser console
# Look for: 🔀 NextAuth redirect callback
```

## Success Indicators:

✅ Login redirects to correct dashboard
✅ Session persists across page refreshes
✅ No redirect loops
✅ Console shows successful redirect logs
✅ User stays logged in

## Next Steps:

1. Deploy the updated code
2. Set production environment variables
3. Test the login flow
4. Monitor for any remaining issues
5. Update documentation if needed
