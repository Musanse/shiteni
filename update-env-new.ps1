# Update MongoDB URI in .env.local with new connection string
$envContent = @"
# Environment Variables for Mankuca

# Database Configuration
MONGODB_URI=mongodb+srv://zeedemypartners_db_user:GRvk0Kddj8p0PBUR@cluster0.n52xav4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# JWT Configuration
JWT_SECRET=your-jwt-secret-change-this-in-production

# Application Configuration
NODE_ENV=development

# Instructions:
# 1. Copy this file to .env.local
# 2. Update the values with your actual configuration
# 3. Make sure MongoDB is running on your system
# 4. Generate secure secrets for production deployment
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Updated .env.local with new MongoDB Atlas URI"
