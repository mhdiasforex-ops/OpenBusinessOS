import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizationId: string;
    } & DefaultSession['user'];
    accessToken: string;
    organizationId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    organizationId: string;
    accessToken: string;
  }
}
