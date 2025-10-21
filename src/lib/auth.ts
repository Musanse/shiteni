import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import * as UserModule from '@/models/User';
const { User } = UserModule;

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 NextAuth authorize called');
        
        if (!credentials?.email || !credentials?.password) {
          console.warn('❌ Missing credentials - email or password not provided');
          return null;
        }

        try {
          console.log('🔄 Attempting authentication for:', credentials.email);
          
          const dbConnection = await connectDB();
          
          // If MongoDB is not available, return null to prevent authentication
          if (!dbConnection) {
            console.warn('⚠️ Authentication disabled: MongoDB not connected');
            console.warn('🔧 Please check your MongoDB connection string and credentials');
            console.warn('🔧 Run: node scripts/debug-auth-401.js for help');
            return null;
          }

          console.log('✅ Database connected, searching for user...');
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.warn('❌ User not found:', credentials.email);
            console.log('💡 Available users in database:');
            try {
              const allUsers = await User.find({}, { email: 1, role: 1 }).limit(5);
              allUsers.forEach((u, index) => {
                console.log(`   ${index + 1}. ${u.email} (${u.role || 'no role'})`);
              });
            } catch (err: unknown) {
              console.log('   Could not fetch user list:', err instanceof Error ? err.message : String(err));
            }
            return null;
          }

          console.log('✅ User found, checking password...');
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.warn('❌ Invalid password for:', credentials.email);
            return null;
          }

          console.log('✅ Password valid, checking email verification...');
          // Check if email is verified (REQUIRED)
          if (!user.emailVerified) {
            console.warn('❌ User attempted login with unverified email:', user.email);
            console.log('💡 User must verify email before login');
            return null; // Block login until email is verified
          }

          console.log('✅ Email verified, checking user data...');
          console.log('🎉 Authentication successful for:', user.email);
          console.log('   Role:', user.role);
          console.log('   Name:', `${user.firstName} ${user.lastName}`);
          
          return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            kycStatus: user.kycStatus,
            serviceType: user.serviceType,
          };
        } catch (error: unknown) {
          console.error('❌ Auth error:', error);
          console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
          console.error('   Error message:', error instanceof Error ? error.message : String(error));
          if (error instanceof Error && error.stack) {
            console.error('   Stack trace:', error.stack);
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.kycStatus = user.kycStatus;
        token.institutionId = user.institutionId;
        token.serviceType = user.serviceType; // Add service type for vendors
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.kycStatus = token.kycStatus as string;
        session.user.institutionId = token.institutionId as string;
        session.user.serviceType = token.serviceType as string; // Add service type for vendors
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      console.log('🔀 NextAuth redirect callback:', { url, baseUrl });
      
      // Handle production vs development URLs
      const isProduction = process.env.NODE_ENV === 'production';
      const productionUrl = process.env.NEXTAUTH_URL || baseUrl;
      
      // If url is relative, make it absolute
      if (url.startsWith('/')) {
        const redirectUrl = isProduction ? `${productionUrl}${url}` : `${baseUrl}${url}`;
        console.log('🔀 Relative URL redirect:', redirectUrl);
        return redirectUrl;
      }
      
      // If url is on the same origin, allow it
      try {
        const urlObj = new URL(url);
        const allowedOrigins = [baseUrl, productionUrl].filter(Boolean);
        const isAllowedOrigin = allowedOrigins.some(origin => urlObj.origin === origin);
        
        if (isAllowedOrigin) {
          console.log('🔀 Same origin redirect:', url);
          return url;
        }
      } catch (error) {
        console.error('🔀 Invalid URL in redirect:', url, error);
      }
      
      // Default redirect to dashboard (let middleware handle role-based routing)
      const defaultRedirect = isProduction ? `${productionUrl}/dashboard` : `${baseUrl}/dashboard`;
      console.log('🔀 Default redirect to dashboard (middleware will handle routing):', defaultRedirect);
      return defaultRedirect;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production'
};

export default authOptions;