# 🚨 MongoDB Authentication Failed - Complete Fix Guide

## Current Status
```
❌ MongoDB connection failed: bad auth : Authentication failed.
```

## Root Cause
The MongoDB credentials in your connection string are incorrect or the user doesn't exist.

## 🔧 IMMEDIATE FIX REQUIRED

### Step 1: Access MongoDB Atlas
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Log in to your account
3. Select your project

### Step 2: Check Database Access
1. Click **Database Access** in the left sidebar
2. Look for user: `zeedemypartners_db_user`
3. If it doesn't exist, you need to create it

### Step 3: Create New Database User (Recommended)
1. Click **Add New Database User**
2. **Authentication Method**: Password
3. **Username**: `mankuca_user`
4. **Password**: Click **Autogenerate Secure Password**
5. **Database User Privileges**: 
   - Select **Read and write to any database**
6. Click **Add User**

### Step 4: Check Network Access
1. Click **Network Access** in the left sidebar
2. Click **Add IP Address**
3. For development, add: `0.0.0.0/0` (allows all IPs)
4. Click **Confirm**

### Step 5: Get Connection String
1. Click **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Select **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your new password

### Step 6: Update .env.local
Replace the MONGODB_URI line with:
```bash
MONGODB_URI="mongodb+srv://mankuca_user:YOUR_NEW_PASSWORD@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
```

### Step 7: Test Connection
```bash
node scripts/test-connection-simple.js
```

## ✅ Expected Success Output
```
✅ Successfully connected to MongoDB
📋 Available databases:
   - admin
   - local
   - mankuca (or similar)
✅ Connection test completed
```

## 🚀 Alternative: Use Existing User
If you want to keep the existing user:

1. Go to **Database Access**
2. Find `zeedemypartners_db_user`
3. Click **Edit**
4. Click **Edit Password**
5. Generate new password
6. Update `.env.local` with new password

## 📋 Quick Commands
```bash
# Test connection
node scripts/test-connection-simple.js

# Start the app (after fixing MongoDB)
npm run dev

# Test authentication
# Try logging in with admin@mankuca.com / admin123
```

## 🔍 Troubleshooting
- **User doesn't exist**: Create new user
- **Wrong password**: Reset password
- **No permissions**: Grant read/write access
- **Network blocked**: Add IP to whitelist
- **Database doesn't exist**: MongoDB will create it automatically

---

**Once MongoDB is fixed, your 401 authentication errors will be resolved and login will work properly.**
