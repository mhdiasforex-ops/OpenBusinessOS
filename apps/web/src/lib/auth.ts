import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Server-side: use internal Docker hostname when available
// Client-side: always use NEXT_PUBLIC_API_URL (localhost from browser)
const API_URL = process.env.NEXTAUTH_API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const authOptions: NextAuthOptions = {
 providers: [
 CredentialsProvider({
 name: 'Credentials',
 credentials: {
 email: { label: 'Email', type: 'email' },
 password: { label: 'Password', type: 'password' },
 },
 async authorize(credentials) {
 if (!credentials?.email || !credentials?.password) return null;

 try {
 const res = await fetch(`${API_URL}/auth/login`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 email: credentials.email,
 password: credentials.password,
 }),
 });

 if (!res.ok) return null;
 const data = await res.json();

 return {
 id: data.user.id,
 name: data.user.name,
 email: data.user.email,
 organizationId: data.user.organizationId,
 organizationName: data.organization?.name || '',
 role: data.user.roles?.[0]?.role?.name || '',
 accessToken: data.accessToken,
 };
 } catch {
 return null;
 }
 },
 }),
 ],
 callbacks: {
 async jwt({ token, user }) {
 if (user) {
 token.id = user.id;
 token.accessToken = (user as any).accessToken;
 token.organizationId = (user as any).organizationId;
 token.organizationName = (user as any).organizationName;
 token.role = (user as any).role;
 }
 return token;
 },
 async session({ session, token }) {
 if (session.user) {
 (session.user as any).id = token.id;
 (session.user as any).organizationId = token.organizationId;
 (session.user as any).organizationName = token.organizationName;
 (session.user as any).role = token.role;
 }
 (session as any).accessToken = token.accessToken;
 (session as any).organizationId = token.organizationId;
 (session as any).organizationName = token.organizationName;
 (session as any).role = token.role;
 return session;
 },
 },
 pages: {
 signIn: '/login',
 },
 session: {
 strategy: 'jwt',
 },
 secret: process.env.NEXTAUTH_SECRET,
};
