# Fix Email Delivery on Local Machine

## Problem
Your local DNS server (10.56.233.218) cannot resolve `mail.shiteni.com`, preventing email delivery during local development.

## Solution 1: Add Host Entry (Admin Required)

Run this command **as Administrator** in PowerShell:

```powershell
# 1. Add entry to hosts file
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "66.29.153.41`tmail.shiteni.com"
```

Or manually:
1. Open Notepad as Administrator
2. Open `C:\Windows\System32\drivers\etc\hosts`
3. Add this line at the end:
```
66.29.153.41    mail.shiteni.com
```
4. Save the file

## Solution 2: Use Direct IP in Code (No Admin Required)

Since we can't modify hosts file without admin rights, let's modify the email configuration to bypass DNS.

### Option A: Update .env to use IP
```bash
SMTP_HOST=66.29.153.41
SMTP_PORT=587
```

### Option B: Add IP bypass in code

Open `src/lib/email.ts` and add DNS lookup fallback.

## Solution 3: Use Different SMTP for Local Development

Use a mail service that works regardless of DNS, like Gmail SMTP:

```bash
# In your .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
```

## Quick Test

After implementing any solution, test with:
```
http://localhost:3000/api/test-email-send?email=your@email.com
```

## Current DNS Issue

- Your DNS server: 10.56.233.218 (corporate/VPN)
- Does NOT resolve mail.shiteni.com
- mail.shiteni.com actually exists: 66.29.153.41

