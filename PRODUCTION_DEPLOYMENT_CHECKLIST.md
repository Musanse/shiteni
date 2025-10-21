# Production Deployment Checklist

## Critical Issue: Login Redirect Not Working in Production

### Current Status
- ✅ Code pushed to GitHub
- ✅ Service worker registering successfully
- ✅ Stats loading correctly
- ❌ Login redirect failing (stuck on signin page with callbackUrl)

### Root Cause
Missing `NEXTAUTH_URL` environment variable in production deployment.

### Immediate Action Required

#### Step 1: Set Environment Variables in Production

**For Vercel:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `mankuca` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```bash
NEXTAUTH_URL=https://www.mankuca.com
NEXTAUTH_SECRET=your-super-secret-key-here
NODE_ENV=production
```

**For Other Platforms:**
Set these environment variables in your hosting platform:
```bash
NEXTAUTH_URL=https://www.mankuca.com
NEXTAUTH_SECRET=your-super-secret-key-here
NODE_ENV=production
```

#### Step 2: Generate Secret Key
```bash
# Generate a secure secret key
openssl rand -base64 32
```

#### Step 3: Redeploy
After setting environment variables, trigger a new deployment.

### Verification Steps

1. **Check Environment Variables**
   - Verify `NEXTAUTH_URL` is set correctly
   - Ensure it matches your production domain exactly

2. **Test Login Flow**
   - Go to production site
   - Try logging in with admin credentials
   - Check browser console for redirect logs

3. **Monitor Logs**
   - Look for `🔀 NextAuth redirect callback:` logs
   - Check for any error messages

### Expected Behavior After Fix

✅ User logs in successfully
✅ Redirects to `/dashboard/admin`
✅ Dashboard loads correctly
✅ Session persists across page refreshes
✅ No redirect loops

### Debug Information

**Browser Console Should Show:**
```
🔀 Sign-in callback URL: /dashboard/admin
🔀 Redirecting to: https://www.mankuca.com/dashboard/admin
```

**Network Tab Should Show:**
- Successful POST to `/api/auth/callback/credentials`
- Redirect to `/dashboard/admin`
- Dashboard page loads

### Common Issues & Solutions

#### Issue 1: Domain Mismatch
**Error**: Redirects to localhost or wrong domain
**Solution**: Ensure `NEXTAUTH_URL` matches production domain exactly

#### Issue 2: HTTPS Required
**Error**: Mixed content errors
**Solution**: Use HTTPS URLs in production

#### Issue 3: Missing Secret
**Error**: NextAuth errors
**Solution**: Set a strong `NEXTAUTH_SECRET`

#### Issue 4: Cookie Issues
**Error**: Session not persisting
**Solution**: Ensure `useSecureCookies: true` in production

### Environment Variable Examples

#### Development (.env.local):
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key
NODE_ENV=development
```

#### Production (Vercel):
```bash
NEXTAUTH_URL=https://www.mankuca.com
NEXTAUTH_SECRET=production-super-secret-key-here
NODE_ENV=production
```

### Testing Commands

```bash
# Test session endpoint
curl https://www.mankuca.com/api/auth/session

# Check if environment variables are set
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET
```

### Success Indicators

✅ Login form submits successfully
✅ Redirects to dashboard after login
✅ Dashboard loads with user data
✅ Session persists across page refreshes
✅ No console errors
✅ No redirect loops

### Next Steps

1. **Set environment variables** in your hosting platform
2. **Redeploy** your application
3. **Test login flow** on production
4. **Monitor** for any remaining issues
5. **Update** documentation if needed

### Contact Information

If you need help with deployment:
- **Vercel Support**: [Vercel Documentation](https://vercel.com/docs)
- **GitHub Issues**: [Create an issue](https://github.com/Kelstico/mankuca/issues)

### Timeline

- **Immediate**: Set environment variables
- **Within 5 minutes**: Redeploy application
- **Within 10 minutes**: Test login flow
- **Within 15 minutes**: Verify everything works

---

**Note**: This is a critical production issue that needs immediate attention. The login functionality is currently broken in production due to missing environment variables.
