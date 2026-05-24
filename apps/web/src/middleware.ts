export { default } from 'next-auth/middleware';

export const config = {
 matcher: [
  '/dashboard/:path*',
  '/analytics/:path*',
  '/financial/:path*',
  '/crm/:path*',
  '/products/:path*',
  '/suppliers/:path*',
  '/contracts/:path*',
  '/workflows/:path*',
  '/templates/:path*',
  '/reports/:path*',
  '/whatsapp/:path*',
  '/cms/:path*',
  '/lgpd/:path*',
  '/fiscal/:path*',
  '/payments/:path*',
  '/ai-agent/:path*',
  '/scheduler/:path*',
  '/inventory/:path*',
  '/sales/:path*',
  '/omnichannel/:path*',
  '/rh/:path*',
  '/compliance/:path*',
  '/settings/:path*',
 ],
};
