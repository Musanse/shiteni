export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  nextauth: {
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-here',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};
