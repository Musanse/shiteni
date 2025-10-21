declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      kycStatus: string;
      institutionId?: string;
      serviceType?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    kycStatus: string;
    institutionId?: string;
    serviceType?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    firstName: string;
    lastName: string;
    kycStatus: string;
    institutionId?: string;
    serviceType?: string;
  }
}
