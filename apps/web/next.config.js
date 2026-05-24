/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@openbusinessos/shared-types', '@openbusinessos/event-definitions', '@openbusinessos/utils'],
  // Remove 'standalone' output — causes Windows chunk resolution errors during prerendering
  // Re-enable only for Docker production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
