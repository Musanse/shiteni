# 🚨 CRITICAL: Production Environment Setup Required

## Immediate Issue: Login & Password Reset Not Working

Your production application is currently **BROKEN** because essential environment variables are missing.

### Current Problems:
- ❌ Login redirects fail (stuck on signin page)
- ❌ Password reset links point to `localhost:3000` instead of production
- ❌ Dashboard access blocked
- ❌ Session management broken

### Root Cause:
Missing `NEXTAUTH_URL` environment variable in production deployment.

---

## 🔧 IMMEDIATE FIX REQUIRED

### Step 1: Set Environment Variables in Production

#### For Vercel (Most Common):

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your `mankuca` project

2. **Navigate to Settings**
   - Click on **Settings** tab
   - Go to **Environment Variables** section

3. **Add These Variables:**

```bash
# CRITICAL - Required for authentication
NEXTAUTH_URL=https://www.mankuca.com

# CRITICAL - Required for session security
NEXTAUTH_SECRET=your-super-secret-key-here

# Environment
NODE_ENV=production

# Database (if not already set)
MONGODB_URI=your-mongodb-connection-string

# Email Service (if not already set)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@mankuca.com
```

#### For Other Hosting Platforms:

**Netlify:**
- Site Settings → Environment Variables
- Add the same variables as above

**Railway:**
- Project Settings → Variables
- Add the same variables as above

**DigitalOcean App Platform:**
- App Settings → Environment Variables
- Add the same variables as above

### Step 2: Generate Secure Secret Key

```bash
# Generate a secure secret key (run this command)
openssl rand -base64 32
```

**Or use this online generator:**
- Visit: [generate-secret.vercel.app](https://generate-secret.vercel.app)
- Copy the generated key
- Use it as your `NEXTAUTH_SECRET`

### Step 3: Redeploy Application

After setting environment variables:
- **Vercel**: Automatic redeploy happens
- **Other platforms**: Trigger a new deployment

---

## ✅ Verification Steps

### 1. Check Environment Variables
```bash
# Test if environment variables are set correctly
curl https://www.mankuca.com/api/auth/session
```

### 2. Test Login Flow
1. Go to `https://www.mankuca.com/auth/signin`
2. Enter admin credentials:
   - Email: `admin@mankuca.com`
   - Password: `admin123`
3. Should redirect to `/dashboard/admin`

### 3. Test Password Reset
1. Go to `https://www.mankuca.com/auth/forgot-password`
2. Enter email: `admin@mankuca.com`
3. Check email for reset link
4. Reset link should point to `https://www.mankuca.com/auth/reset-password?token=...`

### 4. Check Browser Console
Should see logs like:
```
🔀 NextAuth redirect callback: {
  url: 'https://www.mankuca.com/dashboard/admin',
  baseUrl: 'https://www.mankuca.com'
}
🔀 Same origin redirect: https://www.mankuca.com/dashboard/admin
```

---

## 🐛 Troubleshooting

### Issue 1: Still Getting localhost URLs
**Solution**: Ensure `NEXTAUTH_URL` is set exactly to `https://www.mankuca.com`

### Issue 2: Login Still Fails
**Solution**: Check that `NEXTAUTH_SECRET` is set and redeploy

### Issue 3: Session Not Persisting
**Solution**: Verify `useSecureCookies: true` is working in production

### Issue 4: Email Links Still Wrong
**Solution**: Clear browser cache and try password reset again

---

## 📋 Environment Variable Checklist

- [ ] `NEXTAUTH_URL=https://www.mankuca.com`
- [ ] `NEXTAUTH_SECRET=<generated-secret-key>`
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=<your-mongodb-uri>`
- [ ] `SMTP_HOST=<your-smtp-host>`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_USER=<your-smtp-username>`
- [ ] `SMTP_PASS=<your-smtp-password>`
- [ ] `SMTP_FROM=noreply@mankuca.com`

---

## 🔄 After Fix - Expected Behavior

✅ **Login Works**: Users can sign in successfully
✅ **Redirects Work**: Automatic redirect to dashboard after login
✅ **Password Reset Works**: Reset links point to production domain
✅ **Dashboard Access**: Users can access their dashboards
✅ **Session Persists**: Login state maintained across page refreshes
✅ **No Redirect Loops**: Smooth navigation experience

---

## 📞 Need Help?

### Vercel Support:
- [Vercel Documentation](https://vercel.com/docs)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)

### Common Issues:
- **Domain mismatch**: Ensure `NEXTAUTH_URL` matches your production domain exactly
- **HTTPS required**: Use HTTPS URLs in production
- **Secret key**: Use a strong, unique secret key
- **Redeploy**: Always redeploy after changing environment variables

---

## ⚡ Timeline

- **0-5 minutes**: Set environment variables
- **5-10 minutes**: Redeploy application
- **10-15 minutes**: Test login and password reset
- **15+ minutes**: Verify all functionality works

---

**🚨 This is a critical production issue that needs immediate attention. Your application is currently unusable until these environment variables are set correctly.**