# Email SMTP Fix Guide

## Problem
The email verification is failing because `mail.shiteni.com` doesn't exist in DNS.

## Root Cause
The domain `mail.shiteni.com` cannot be found when trying to send emails.

## Solutions

### Option 1: Use Real SMTP Host
Find your actual mail server hostname:

1. **For Namecheap hosting:**
   - Login to cPanel
   - Look for "Email Accounts" or "Email Routing"
   - Check the mail server settings
   - Common formats:
     - `mail.yourname.com`
     - `smtp.domain.com`
     - Or use the domain's main hostname

2. **Update environment variables:**
   ```bash
   # In your .env or Render environment variables
   SMTP_HOST=actual-mail-server.com  # Change this!
   SMTP_PORT=587
   SMTP_USER=support@shiteni.com
   SMTP_PASS=your-password
   SMTP_SECURE=false
   ```

### Option 2: Use Gmail SMTP (Quick Test)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Get from Google Account settings
SMTP_SECURE=false
```

### Option 3: Use Professional Email Service
Recommended providers:
- **SendGrid**: Free tier (100 emails/day)
- **Mailgun**: Free tier available
- **Postmark**: Great for transactional emails
- **Resend**: Modern and developer-friendly

### Option 4: Use Your Domain's Mail (If Configured)
If you have email configured on your domain:
```bash
# Check your domain's MX records
# Use the mail server from your hosting provider
SMTP_HOST=smtp.your-hosting-provider.com
SMTP_PORT=587
SMTP_USER=support@shiteni.com
SMTP_PASS=your-email-password
```

## Testing
Use the test endpoint: `/api/test-email-send?email=your@email.com`

## Current Error
```
getaddrinfo ENOTFOUND mail.shiteni.com
```
This means `mail.shiteni.com` doesn't resolve to any IP address.

## Next Steps
1. Find your actual mail server hostname
2. Update the `SMTP_HOST` environment variable
3. Test with the endpoint above
4. Redeploy on Render

